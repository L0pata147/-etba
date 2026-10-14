-- Soutěže ve skupině: kvíz dne a duely. Týdenní výzva běží přes souhrny z group.sql (nic dalšího nepotřebuje).
-- Nejdřív musí být spuštěný group.sql.
-- Spusť celé v Supabase: SQL Editor → New query → vlož → Run. Lze spustit opakovaně.

create table if not exists public.group_contests (
  id text primary key,
  group_code text not null,
  kind text not null check (kind in ('den', 'duel')),
  questions jsonb not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists group_contests_group_idx on public.group_contests (group_code, created_at desc);

create table if not exists public.group_contest_results (
  contest_id text not null references public.group_contests (id) on delete cascade,
  member text not null,
  name text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (contest_id, member)
);

-- Přímý přístup k tabulkám je zakázaný, data jdou jen přes funkce níže.
alter table public.group_contests enable row level security;
alter table public.group_contest_results enable row level security;
revoke all on public.group_contests from anon, authenticated;
revoke all on public.group_contest_results from anon, authenticated;

-- ---------- pomocné funkce (zvenku se volat nedají) ----------

-- Veřejný identifikátor člena – z tajného se dá spočítat, ale ne naopak
create or replace function public.group_pid(p_member text)
returns text
language sql
immutable
as $$ select left(md5('mt:' || p_member), 12) $$;

-- Ověří členství ve skupině a vrátí přezdívku
create or replace function public.contest_member(p_group text, p_member text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_name text;
begin
  select name into v_name from public.group_members where group_code = p_group and member = p_member;
  if v_name is null then raise exception 'not_member'; end if;
  return v_name;
end;
$$;

create or replace function public.contest_check_questions(p jsonb)
returns void
language plpgsql
as $$
begin
  if p is null or jsonb_typeof(p) <> 'array' or jsonb_array_length(p) < 1 or jsonb_array_length(p) > 20 then raise exception 'invalid_questions'; end if;
  if octet_length(p::text) > 40000 then raise exception 'too_large'; end if;
end;
$$;

-- Výsledky jedné soutěže (bez tajných identifikátorů), nejlepší první
create or replace function public.contest_results(p_contest text, p_member text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
      'name', coalesce(m.name, r.name),
      'pid', public.group_pid(r.member),
      'me', r.member = p_member,
      'result', r.result,
      'at', r.created_at)
    order by (r.result->>'points')::numeric desc, (r.result->>'seconds')::numeric asc), '[]'::json)
  from public.group_contest_results r
  join public.group_contests c on c.id = r.contest_id
  left join public.group_members m on m.group_code = c.group_code and m.member = r.member
  where r.contest_id = p_contest
$$;

-- ---------- žebříček skupiny: nově i s veřejným identifikátorem (kvůli duelům) ----------
create or replace function public.group_list(p_group text, p_member text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_group is null or length(p_group) < 10 then raise exception 'invalid_group'; end if;
  return coalesce((
    select json_agg(json_build_object('name', name, 'stats', stats, 'updated_at', updated_at, 'me', member = p_member, 'pid', public.group_pid(member)) order by updated_at desc)
    from public.group_members where group_code = p_group
  ), '[]'::json);
end;
$$;

-- ---------- kvíz dne ----------
-- Vrátí dnešní kvíz skupiny (otázky + výsledky) a výsledky z posledních 7 dní.
-- Když kvíz ještě neexistuje a jsou poslané otázky, založí ho (první, kdo ho ten den otevře).
create or replace function public.contest_daily(p_group text, p_member text, p_day text, p_questions jsonb default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_day date;
  v_q jsonb;
begin
  perform public.contest_member(p_group, p_member);
  if p_day is null or p_day !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'invalid_day'; end if;
  v_day := p_day::date;
  if v_day < current_date - 1 or v_day > current_date + 1 then raise exception 'invalid_day'; end if;
  v_id := 'den:' || p_group || ':' || p_day;
  if p_questions is not null then
    perform public.contest_check_questions(p_questions);
    insert into public.group_contests (id, group_code, kind, questions, meta)
    values (v_id, p_group, 'den', p_questions, jsonb_build_object('day', p_day))
    on conflict (id) do nothing;
    -- úklid starých soutěží
    delete from public.group_contests where created_at < now() - interval '60 days';
  end if;
  select questions into v_q from public.group_contests where id = v_id;
  return json_build_object(
    'id', v_id,
    'day', p_day,
    'questions', v_q,
    'results', public.contest_results(v_id, p_member),
    'history', coalesce((
      select json_agg(json_build_object('day', c.meta->>'day', 'results', public.contest_results(c.id, p_member)) order by c.meta->>'day' desc)
      from public.group_contests c
      where c.group_code = p_group and c.kind = 'den'
        and c.meta->>'day' < p_day and c.meta->>'day' >= to_char(v_day - 7, 'YYYY-MM-DD')
    ), '[]'::json)
  );
end;
$$;

-- ---------- odeslání výsledku (kvíz dne i duel) – každý jen jednou ----------
create or replace function public.contest_submit(p_group text, p_member text, p_contest text, p_result jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_c public.group_contests%rowtype;
  v_n int;
begin
  v_name := public.contest_member(p_group, p_member);
  select * into v_c from public.group_contests where id = p_contest and group_code = p_group;
  if not found then raise exception 'contest_not_found'; end if;
  if v_c.kind = 'duel' and public.group_pid(p_member) not in (v_c.meta->>'from', v_c.meta->>'to') then raise exception 'not_member'; end if;
  if v_c.kind = 'den' and (v_c.meta->>'day')::date < current_date - 2 then raise exception 'too_late'; end if;
  if v_c.kind = 'duel' and v_c.created_at < now() - interval '8 days' then raise exception 'too_late'; end if;
  if p_result is null or jsonb_typeof(p_result) <> 'object' or octet_length(p_result::text) > 3000 then raise exception 'invalid_result'; end if;
  if coalesce(jsonb_typeof(p_result->'points'), '') <> 'number'
    or coalesce(jsonb_typeof(p_result->'seconds'), '') <> 'number'
    or coalesce(jsonb_typeof(p_result->'correct'), '') <> 'number'
    or (p_result->>'points')::numeric < 0
    or (p_result->>'points')::numeric > 100 * jsonb_array_length(v_c.questions)
    or (p_result->>'correct')::numeric > jsonb_array_length(v_c.questions) then
    raise exception 'invalid_result';
  end if;
  insert into public.group_contest_results (contest_id, member, name, result)
  values (p_contest, p_member, v_name, p_result)
  on conflict (contest_id, member) do nothing;
  get diagnostics v_n = row_count;
  return json_build_object('ok', true, 'already', v_n = 0);
end;
$$;

-- ---------- duely ----------
create or replace function public.duel_create(p_group text, p_member text, p_to text, p_subject text, p_questions jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_from text;
  v_to_name text;
  v_n int;
  v_id text;
begin
  v_name := public.contest_member(p_group, p_member);
  v_from := public.group_pid(p_member);
  select name into v_to_name from public.group_members where group_code = p_group and public.group_pid(member) = p_to;
  if p_to is null or p_to = v_from or v_to_name is null then raise exception 'invalid_opponent'; end if;
  if p_subject is null or p_subject not in ('mix', 'cjl', 'site', 'hw', 'cloud') then raise exception 'invalid_subject'; end if;
  perform public.contest_check_questions(p_questions);
  select count(*) into v_n from public.group_contests
  where group_code = p_group and kind = 'duel' and meta->>'from' = v_from and created_at > now() - interval '1 day';
  if v_n >= 20 then raise exception 'too_many_duels'; end if;
  v_id := 'duel:' || substr(md5(random()::text || clock_timestamp()::text || p_member), 1, 20);
  insert into public.group_contests (id, group_code, kind, questions, meta)
  values (v_id, p_group, 'duel', p_questions, jsonb_build_object('from', v_from, 'to', p_to, 'subject', p_subject, 'from_name', v_name, 'to_name', v_to_name));
  return json_build_object('id', v_id);
end;
$$;

-- Moje duely za posledních 14 dní (otázky + výsledky obou)
create or replace function public.duel_list(p_group text, p_member text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare v_me text;
begin
  perform public.contest_member(p_group, p_member);
  v_me := public.group_pid(p_member);
  return coalesce((
    select json_agg(x order by x.created_at desc) from (
      select
        c.id,
        c.meta->>'subject' as subject,
        c.created_at,
        c.questions,
        c.meta->>'from' as from_pid,
        c.meta->>'to' as to_pid,
        c.meta->>'to' = v_me as incoming,
        coalesce((select m.name from public.group_members m where m.group_code = p_group and public.group_pid(m.member) = c.meta->>'from'), c.meta->>'from_name') as from_name,
        coalesce((select m.name from public.group_members m where m.group_code = p_group and public.group_pid(m.member) = c.meta->>'to'), c.meta->>'to_name') as to_name,
        public.contest_results(c.id, p_member) as results
      from public.group_contests c
      where c.group_code = p_group and c.kind = 'duel' and c.created_at > now() - interval '14 days'
        and v_me in (c.meta->>'from', c.meta->>'to')
      order by c.created_at desc
      limit 30
    ) x
  ), '[]'::json);
end;
$$;

-- Krátký stav pro domovskou stránku a upozornění na telefonu
create or replace function public.contest_status(p_group text, p_member text, p_day text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me text;
  v_id text;
begin
  perform public.contest_member(p_group, p_member);
  v_me := public.group_pid(p_member);
  v_id := 'den:' || p_group || ':' || coalesce(p_day, '');
  return json_build_object(
    'daily', (select count(*) from public.group_contest_results where contest_id = v_id),
    'played', exists (select 1 from public.group_contest_results where contest_id = v_id and member = p_member),
    'waiting', coalesce((
      select json_agg(coalesce(m.name, c.meta->>'from_name') order by c.created_at)
      from public.group_contests c
      left join public.group_members m on m.group_code = c.group_code and public.group_pid(m.member) = c.meta->>'from'
      where c.group_code = p_group and c.kind = 'duel' and c.meta->>'to' = v_me and c.created_at > now() - interval '7 days'
        and not exists (select 1 from public.group_contest_results r where r.contest_id = c.id and r.member = p_member)
        and exists (select 1 from public.group_contest_results r where r.contest_id = c.id and r.member <> p_member)
    ), '[]'::json)
  );
end;
$$;

-- ---------- práva ----------
revoke all on function public.group_pid(text) from public, anon, authenticated;
revoke all on function public.contest_member(text, text) from public, anon, authenticated;
revoke all on function public.contest_check_questions(jsonb) from public, anon, authenticated;
revoke all on function public.contest_results(text, text) from public, anon, authenticated;

revoke all on function public.group_list(text, text) from public;
revoke all on function public.contest_daily(text, text, text, jsonb) from public;
revoke all on function public.contest_submit(text, text, text, jsonb) from public;
revoke all on function public.duel_create(text, text, text, text, jsonb) from public;
revoke all on function public.duel_list(text, text) from public;
revoke all on function public.contest_status(text, text, text) from public;

grant execute on function public.group_list(text, text) to anon;
grant execute on function public.contest_daily(text, text, text, jsonb) to anon;
grant execute on function public.contest_submit(text, text, text, jsonb) to anon;
grant execute on function public.duel_create(text, text, text, text, jsonb) to anon;
grant execute on function public.duel_list(text, text) to anon;
grant execute on function public.contest_status(text, text, text) to anon;

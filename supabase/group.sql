-- Skupiny kamarádů: každý vidí přezdívky a souhrn pokroku ostatních ve skupině.
-- Spusť celé v Supabase: SQL Editor → New query → vlož → Run. Lze spustit opakovaně.

create table if not exists public.group_members (
  group_code text not null,
  member text not null,
  name text not null,
  stats jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (group_code, member)
);

-- Přímý přístup k tabulce je zakázaný, data jdou jen přes funkce níže.
alter table public.group_members enable row level security;
revoke all on public.group_members from anon, authenticated;

-- Uložení vlastního souhrnu (member = tajný identifikátor člena, ostatní ho nevidí)
create or replace function public.group_put(p_group text, p_member text, p_name text, p_stats jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if p_group is null or length(p_group) < 10 or length(p_group) > 40 then raise exception 'invalid_group'; end if;
  if p_member is null or length(p_member) < 24 or length(p_member) > 64 then raise exception 'invalid_member'; end if;
  if p_name is null or length(btrim(p_name)) < 1 or length(p_name) > 30 then raise exception 'invalid_name'; end if;
  if octet_length(p_stats::text) > 4000 then raise exception 'too_large'; end if;
  if not exists (select 1 from public.group_members where group_code = p_group and member = p_member) then
    select count(*) into n from public.group_members where group_code = p_group;
    if n >= 100 then raise exception 'group_full'; end if;
  end if;
  insert into public.group_members (group_code, member, name, stats, updated_at)
  values (p_group, p_member, btrim(p_name), p_stats, now())
  on conflict (group_code, member) do update set name = excluded.name, stats = excluded.stats, updated_at = now();
  return json_build_object('ok', true);
end;
$$;

-- Žebříček skupiny (bez tajných identifikátorů, jen příznak „já“)
create or replace function public.group_list(p_group text, p_member text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_group is null or length(p_group) < 10 then raise exception 'invalid_group'; end if;
  return coalesce((
    select json_agg(json_build_object('name', name, 'stats', stats, 'updated_at', updated_at, 'me', member = p_member) order by updated_at desc)
    from public.group_members where group_code = p_group
  ), '[]'::json);
end;
$$;

-- Odchod ze skupiny
create or replace function public.group_leave(p_group text, p_member text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.group_members where group_code = p_group and member = p_member;
  return json_build_object('ok', true);
end;
$$;

revoke all on function public.group_put(text, text, text, jsonb) from public;
revoke all on function public.group_list(text, text) from public;
revoke all on function public.group_leave(text, text) from public;
grant execute on function public.group_put(text, text, text, jsonb) to anon;
grant execute on function public.group_list(text, text) to anon;
grant execute on function public.group_leave(text, text) to anon;

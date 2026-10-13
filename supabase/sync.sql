-- Synchronizace pokroku Maturitního trenéra mezi zařízeními.
-- Spusť celé v Supabase: SQL Editor → New query → vlož → Run.

create table if not exists public.sync_data (
  code text primary key,
  data jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

-- Přímý přístup k tabulce je zakázaný (RLS bez pravidel), data jdou jen přes funkce níže.
alter table public.sync_data enable row level security;
revoke all on public.sync_data from anon, authenticated;

-- Načtení dat podle kódu zařízení
create or replace function public.sync_get(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare r public.sync_data;
begin
  if p_code is null or length(p_code) < 24 then
    raise exception 'invalid_code';
  end if;
  select * into r from public.sync_data where code = p_code;
  if not found then
    return null;
  end if;
  return json_build_object('data', r.data, 'version', r.version, 'updated_at', r.updated_at);
end;
$$;

-- Uložení dat; p_expected_version = verze, ze které klient vycházel (0 = nový záznam).
-- Když mezitím data změnilo jiné zařízení, vrátí ok = false a klient je nejdřív sloučí.
create or replace function public.sync_put(p_code text, p_data jsonb, p_expected_version bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare cur bigint;
begin
  if p_code is null or length(p_code) < 24 then
    raise exception 'invalid_code';
  end if;
  if octet_length(p_data::text) > 5000000 then
    raise exception 'too_large';
  end if;
  select version into cur from public.sync_data where code = p_code for update;
  if not found then
    if p_expected_version <> 0 then
      return json_build_object('ok', false, 'version', 0);
    end if;
    insert into public.sync_data (code, data) values (p_code, p_data);
    return json_build_object('ok', true, 'version', 1);
  end if;
  if cur <> p_expected_version then
    return json_build_object('ok', false, 'version', cur);
  end if;
  update public.sync_data set data = p_data, version = cur + 1, updated_at = now() where code = p_code;
  return json_build_object('ok', true, 'version', cur + 1);
end;
$$;

revoke all on function public.sync_get(text) from public;
revoke all on function public.sync_put(text, jsonb, bigint) from public;
grant execute on function public.sync_get(text) to anon;
grant execute on function public.sync_put(text, jsonb, bigint) to anon;

-- =====================================================================
-- Planes Adayai · esquema de Supabase
-- Pégalo entero en Supabase → SQL Editor → Run. Se puede re-ejecutar.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------------------------------------------------------------------
-- Perfiles y pareja
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null default '',
  likes       text[] not null default '{}',
  partner_id  uuid references public.profiles(id) on delete set null,
  link_code   text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "ver mi perfil y el de mi pareja" on public.profiles;
create policy "ver mi perfil y el de mi pareja" on public.profiles for select to authenticated
  using (id = auth.uid() or partner_id = auth.uid());

drop policy if exists "editar mi perfil" on public.profiles;
create policy "editar mi perfil" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Solo se pueden editar nombre y gustos; la pareja se cambia con las funciones de abajo.
revoke update on public.profiles from authenticated;
grant update (name, likes) on public.profiles to authenticated;

-- Crear el perfil al registrarse (con gustos iniciales si el nombre es Aday o Yai)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare n text := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, name, likes) values (
    new.id, n,
    case lower(n)
      when 'aday' then array['campo','playa','conciertos','anime','gastronomia','vinos']
      when 'yai'  then array['cultura','museos','ballet','baile','patrimonio']
      else '{}'::text[] end
  ) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.link_partner(code text) returns json
language plpgsql security definer set search_path = public as $$
declare me public.profiles; other public.profiles;
begin
  select * into me from profiles where id = auth.uid();
  select * into other from profiles where link_code = upper(trim(code));
  if other.id is null then raise exception 'Código no encontrado'; end if;
  if other.id = me.id then raise exception 'Ese es tu propio código'; end if;
  if me.partner_id is not null or other.partner_id is not null then raise exception 'Alguno de los dos ya tiene pareja vinculada'; end if;
  update profiles set partner_id = other.id where id = me.id;
  update profiles set partner_id = me.id where id = other.id;
  return json_build_object('partner', other.name);
end $$;

create or replace function public.unlink_partner() returns void
language plpgsql security definer set search_path = public as $$
begin
  update profiles set partner_id = null where id = auth.uid() or partner_id = auth.uid();
end $$;

revoke execute on function public.link_partner(text), public.unlink_partner() from public, anon;
grant execute on function public.link_partner(text), public.unlink_partner() to authenticated;

-- ---------------------------------------------------------------------
-- Eventos (los escribe solo el recolector, con la clave service_role)
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id            text primary key,
  title         text not null,
  description   text,
  category      text not null,
  subcategory   text,
  tags          text[] not null default '{}',
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  all_day       boolean not null default false,
  venue         text,
  municipality  text,
  zone          text,
  lat           double precision not null,
  lng           double precision not null,
  price_min     numeric,
  price_max     numeric,
  url           text,
  sources       jsonb not null default '[]',
  conflicts     text,
  updated_at    timestamptz not null default now()
);
create index if not exists events_time_idx on public.events (starts_at, ends_at);

alter table public.events enable row level security;
drop policy if exists "eventos visibles" on public.events;
create policy "eventos visibles" on public.events for select to authenticated using (true);

create table if not exists public.ingest_log (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  window_start timestamptz, window_end timestamptz,
  upserted    int, removed int
);
alter table public.ingest_log enable row level security;
drop policy if exists "log visible" on public.ingest_log;
create policy "log visible" on public.ingest_log for select to authenticated using (true);

-- Carga un lote del recolector: inserta/actualiza y quita lo que ya no aparece en esa ventana
-- (salvo lo que alguien tenga en favoritos).
create or replace function public.ingest_events(payload jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare ws timestamptz := (payload->>'window_start')::timestamptz;
        we timestamptz := (payload->>'window_end')::timestamptz;
        n_up int; n_rm int;
begin
  insert into events (id, title, description, category, subcategory, tags, starts_at, ends_at, all_day,
                      venue, municipality, zone, lat, lng, price_min, price_max, url, sources, conflicts, updated_at)
  select e->>'id', e->>'title', e->>'description', e->>'category', e->>'subcategory',
         coalesce(array(select jsonb_array_elements_text(e->'tags')), '{}'),
         (e->>'starts_at')::timestamptz, (e->>'ends_at')::timestamptz, coalesce((e->>'all_day')::boolean, false),
         e->>'venue', e->>'municipality', e->>'zone', (e->>'lat')::float8, (e->>'lng')::float8,
         (e->>'price_min')::numeric, (e->>'price_max')::numeric, e->>'url',
         coalesce(e->'sources', '[]'), e->>'conflicts', now()
  from jsonb_array_elements(payload->'events') e
  on conflict (id) do update set
    title = excluded.title, description = excluded.description, category = excluded.category,
    subcategory = excluded.subcategory, tags = excluded.tags, starts_at = excluded.starts_at,
    ends_at = excluded.ends_at, all_day = excluded.all_day, venue = excluded.venue,
    municipality = excluded.municipality, zone = excluded.zone, lat = excluded.lat, lng = excluded.lng,
    price_min = excluded.price_min, price_max = excluded.price_max, url = excluded.url,
    sources = excluded.sources, conflicts = excluded.conflicts, updated_at = now();
  get diagnostics n_up = row_count;

  delete from events ev
  where ev.starts_at >= ws and ev.starts_at < we
    and ev.id not in (select e->>'id' from jsonb_array_elements(payload->'events') e)
    and not exists (select 1 from favorites f where f.event_id = ev.id);
  get diagnostics n_rm = row_count;

  delete from events ev where ev.ends_at < now() - interval '14 days';

  insert into ingest_log (window_start, window_end, upserted, removed) values (ws, we, n_up, n_rm);
  return json_build_object('upserted', n_up, 'removed', n_rm);
end $$;
revoke execute on function public.ingest_events(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_events(jsonb) to service_role;

-- ---------------------------------------------------------------------
-- Favoritos y matches
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  event_id   text not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
alter table public.favorites enable row level security;

drop policy if exists "ver mis favoritos y los de mi pareja" on public.favorites;
create policy "ver mis favoritos y los de mi pareja" on public.favorites for select to authenticated
  using (user_id = auth.uid() or user_id = (select partner_id from public.profiles where id = auth.uid()));
drop policy if exists "añadir mis favoritos" on public.favorites;
create policy "añadir mis favoritos" on public.favorites for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "quitar mis favoritos" on public.favorites;
create policy "quitar mis favoritos" on public.favorites for delete to authenticated using (user_id = auth.uid());

-- Tiempo real: la app de la pareja se entera al momento
do $$ begin
  alter publication supabase_realtime add table public.favorites;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Avisos
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  endpoint    text unique not null,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "mis suscripciones" on public.push_subscriptions;
create policy "mis suscripciones" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.notification_queue (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
alter table public.notification_queue enable row level security; -- solo la función de avisos (service_role)

create table if not exists public.notification_log (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  key      text not null,
  sent_at  timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.notification_log enable row level security;

-- Al marcar un favorito: si la pareja ya lo tenía, aviso de match a los dos
create or replace function public.on_favorite_added() returns trigger
language plpgsql security definer set search_path = public as $$
declare p uuid; t text;
begin
  select partner_id into p from profiles where id = new.user_id;
  if p is not null and exists (select 1 from favorites where user_id = p and event_id = new.event_id) then
    select title into t from events where id = new.event_id;
    insert into notification_queue (user_id, kind, payload) values
      (new.user_id, 'match', jsonb_build_object('event_id', new.event_id, 'title', t)),
      (p,           'match', jsonb_build_object('event_id', new.event_id, 'title', t));
  end if;
  return new;
end $$;
drop trigger if exists favorite_added on public.favorites;
create trigger favorite_added after insert on public.favorites
  for each row execute function public.on_favorite_added();

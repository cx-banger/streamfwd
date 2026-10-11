-- =====================================================================
-- ESPACE ARTISTE — événements et vidéos gérés par les artistes
-- Projet Supabase : hrzmag… (cx-banger-sons)
-- À exécuter UNE fois dans : SQL Editor → New query → Run
-- (après 1_securiser_upload.sql et 2_creer_les_comptes.sql)
--
-- • Un artiste crée / modifie / supprime SES événements et SES vidéos.
-- • Tout ce qu'un artiste publie ou modifie passe « en attente » :
--   seul l'admin peut le passer en « publié » (ou « refusé »).
-- • Le public ne voit que ce qui est publié.
-- • Le contenu actuel du site est importé (déjà publié).
-- =====================================================================

-- Qui est connecté ? -----------------------------------------------------
create or replace function public.my_artist_id()
returns int language sql stable security definer set search_path = public as $$
  select case when a.folder ~ '^artiste[0-9]+$' then substring(a.folder from 8)::int end
  from public.artist_accounts a where a.user_id = auth.uid();
$$;

create or replace function public.is_muzikly_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select a.is_admin from public.artist_accounts a where a.user_id = auth.uid()), false);
$$;

-- Événements -----------------------------------------------------------
create table if not exists public.events (
  id          text primary key,
  type        text not null check (type in ('scene', 'concert', 'album')),
  artist_id   int check (artist_id between 1 and 99),
  title       text,
  date        date not null,
  time        text,
  city        text,
  venue       text,
  address     text,
  lat         double precision,
  lng         double precision,
  image       text,
  ticket_url  text,
  status      text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Vidéos ---------------------------------------------------------------
create table if not exists public.videos (
  id          text primary key,
  type        text not null check (type in ('clip', 'teaser', 'extrait', 'live')),
  artist_id   int check (artist_id between 1 and 99),
  title       text not null,
  url         text not null,
  poster      text,
  track_no    int,
  date        date,
  event_id    text,
  status      text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Un artiste qui crée ou modifie repasse toujours « en attente » ---------
create or replace function public.muzikly_moderation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_muzikly_admin() then
    new.status := 'pending';
    new.artist_id := public.my_artist_id();
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists events_moderation on public.events;
create trigger events_moderation before insert or update on public.events
  for each row execute function public.muzikly_moderation();
drop trigger if exists videos_moderation on public.videos;
create trigger videos_moderation before insert or update on public.videos
  for each row execute function public.muzikly_moderation();

-- Règles d'accès ----------------------------------------------------------
alter table public.events enable row level security;
alter table public.videos enable row level security;

do $$
declare t text;
begin
  foreach t in array array['events', 'videos'] loop
    execute format('drop policy if exists "Public : contenu publié" on public.%I', t);
    execute format('create policy "Public : contenu publié" on public.%I for select to anon, authenticated using (status = ''published'')', t);

    execute format('drop policy if exists "Artiste : voir le sien" on public.%I', t);
    execute format('create policy "Artiste : voir le sien" on public.%I for select to authenticated using (public.is_muzikly_admin() or artist_id = public.my_artist_id())', t);

    execute format('drop policy if exists "Artiste : créer le sien" on public.%I', t);
    execute format('create policy "Artiste : créer le sien" on public.%I for insert to authenticated with check (public.is_muzikly_admin() or public.my_artist_id() is not null)', t);

    execute format('drop policy if exists "Artiste : modifier le sien" on public.%I', t);
    execute format('create policy "Artiste : modifier le sien" on public.%I for update to authenticated using (public.is_muzikly_admin() or artist_id = public.my_artist_id()) with check (public.is_muzikly_admin() or artist_id = public.my_artist_id())', t);

    execute format('drop policy if exists "Artiste : supprimer le sien" on public.%I', t);
    execute format('create policy "Artiste : supprimer le sien" on public.%I for delete to authenticated using (public.is_muzikly_admin() or artist_id = public.my_artist_id())', t);
  end loop;
end $$;

-- Import du contenu actuel (déjà publié) ---------------------------------
-- (le déclencheur de modération ne s'applique pas ici : l'éditeur SQL n'est pas un artiste)
alter table public.events disable trigger events_moderation;
alter table public.videos disable trigger videos_moderation;

insert into public.events (id, type, artist_id, title, date, time, city, venue, address, lat, lng, image, ticket_url, status) values
  ('scene-ouverte-novembre', 'scene', null, 'Scène ouverte Muzikly', '2026-11-07', '19:00', 'Paris', 'Studio ConnexionBanger', 'Adresse communiquée aux inscrits', 48.8566, 2.3522, null, null, 'published'),
  ('nan-live', 'concert', 1, null, '2026-11-19', '20:00', 'Paris', 'Studio ConnexionBanger', 'Adresse à venir', 48.8566, 2.3522, null, null, 'published'),
  ('synai-album', 'album', 2, 'Nouvel album de Synaï', '2026-12-04', '00:00', null, null, null, null, null, null, null, 'published'),
  ('nan-showcase', 'concert', 1, null, '2026-11-27', '20:30', 'Lyon', 'Salle à confirmer', 'Adresse à venir', 45.764, 4.8357, null, null, 'published'),
  ('nan-decembre', 'concert', 1, null, '2026-12-12', '20:00', 'Bruxelles', 'Salle à confirmer', 'Adresse à venir', 50.8503, 4.3517, null, null, 'published'),
  ('eilynn-ep', 'album', 5, 'EP d''Eilynn', '2027-01-16', '00:00', null, null, null, null, null, null, null, 'published')
on conflict (id) do nothing;

insert into public.videos (id, type, artist_id, title, url, poster, track_no, date, event_id, status) values
  ('nan-olala', 'extrait', 1, 'Olala', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste1/1.mp4', null, 1, '2026-09-01', null, 'published'),
  ('nan-bande', 'extrait', 1, 'Bande', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste1/6.mp4', null, 6, '2026-09-01', null, 'published'),
  ('nan-epitre', 'extrait', 1, 'Epitre Au Monde #1', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste1/7.mp4', null, 7, '2026-09-01', null, 'published'),
  ('nan-compassion', 'extrait', 1, 'Compassion', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste1/10.mp4', null, 10, '2026-09-01', null, 'published'),
  ('synai-yhwh', 'extrait', 2, 'YHWH', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste2/1.mp4', null, 1, '2026-09-01', null, 'published'),
  ('elihem-in-god', 'extrait', 3, 'In God', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste3/1.mp4', null, 1, '2026-09-01', null, 'published'),
  ('elihem-vise', 'extrait', 3, 'Visé', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste3/2.mp4', null, 2, '2026-09-01', null, 'published'),
  ('sara-louange', 'extrait', 4, 'Louange à Mon Dieu', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste4/1.mp4', null, 1, '2026-09-01', null, 'published'),
  ('eilynn-cendrillon', 'extrait', 5, 'Cendrillon', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste5/1.mp4', null, 1, '2026-09-01', null, 'published'),
  ('melohim-carriere', 'extrait', 6, 'Ma Carrière', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste6/1.mp4', null, 1, '2026-09-01', null, 'published'),
  ('tiim-montres-moi', 'extrait', 7, 'Montres moi', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste7/1.mp4', null, 1, '2026-09-01', null, 'published'),
  ('raph-zone', 'extrait', 9, 'Zone à danger', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste9/1.mp4', null, 1, '2026-09-01', null, 'published'),
  ('paguiel-outro', 'extrait', 10, 'Outro-Remix', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste10/1.mp4', null, 1, '2026-09-01', null, 'published'),
  ('paguiel-remix-guitare', 'extrait', 10, 'Remix guitare', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste10/2.mp4', null, 2, '2026-09-01', null, 'published'),
  ('teaser-synai-album', 'teaser', 2, 'Nouvel album — teaser', 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste2/1.mp4', null, null, '2026-10-08', 'synai-album', 'published')
on conflict (id) do nothing;

alter table public.events enable trigger events_moderation;
alter table public.videos enable trigger videos_moderation;

-- Vérification
select 'événements' as quoi, status, count(*) from public.events group by status
union all
select 'vidéos', status, count(*) from public.videos group by status;

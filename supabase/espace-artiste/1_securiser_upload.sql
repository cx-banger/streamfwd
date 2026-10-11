-- =====================================================================
-- ESPACE ARTISTE MUZIKLY — sécurisation de l'upload
-- Projet Supabase : celui qui héberge les sons (hrzmag…)
-- À exécuter UNE fois dans : Supabase → SQL Editor → New query → Run
--
-- Ce script :
--   1. ferme l'upload public (n'importe qui pouvait déposer des fichiers) ;
--   2. crée la table qui relie chaque compte artiste à son dossier ;
--   3. autorise chaque artiste connecté à gérer UNIQUEMENT son dossier
--      dans le bucket « sons » (l'admin peut gérer tous les dossiers).
-- La lecture publique des sons (nécessaire à l'app) n'est pas touchée.
-- =====================================================================

-- 1. Fermer l'upload public -------------------------------------------
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Allow public delete" on storage.objects;

-- 2. Comptes artistes -------------------------------------------------
create table if not exists public.artist_accounts (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  folder       text not null unique check (folder ~ '^(artiste[0-9]+|admin)$'),
  display_name text not null,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.artist_accounts enable row level security;

-- Un artiste connecté peut lire sa propre fiche (pour savoir quel est son dossier)
drop policy if exists "Artiste : lire sa fiche" on public.artist_accounts;
create policy "Artiste : lire sa fiche"
  on public.artist_accounts for select
  to authenticated
  using (user_id = auth.uid());

-- Personne ne peut créer / modifier ces fiches depuis l'app :
-- elles se gèrent uniquement depuis le tableau de bord Supabase.

-- 3. Droit d'écriture par dossier ---------------------------------------
create or replace function public.can_write_sons_folder(target_folder text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.artist_accounts a
    where a.user_id = auth.uid()
      and (a.is_admin or a.folder = target_folder)
  );
$$;

drop policy if exists "Artiste : envoyer dans son dossier" on storage.objects;
create policy "Artiste : envoyer dans son dossier"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'sons'
    and public.can_write_sons_folder((storage.foldername(name))[1])
  );

drop policy if exists "Artiste : remplacer dans son dossier" on storage.objects;
create policy "Artiste : remplacer dans son dossier"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'sons'
    and public.can_write_sons_folder((storage.foldername(name))[1])
  )
  with check (
    bucket_id = 'sons'
    and public.can_write_sons_folder((storage.foldername(name))[1])
  );

drop policy if exists "Artiste : supprimer dans son dossier" on storage.objects;
create policy "Artiste : supprimer dans son dossier"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'sons'
    and public.can_write_sons_folder((storage.foldername(name))[1])
  );

-- Vérification : liste des règles actives sur le stockage
-- (il ne doit plus y avoir « Allow public uploads »)
select policyname, cmd, roles from pg_policies where schemaname = 'storage' and tablename = 'objects';

-- =====================================================================
-- 5. Réparation : remet en ligne la scène ouverte et les 3 concerts de NΛN
--    (ils étaient repassés « en attente » après une modification faite
--    depuis le SQL Editor). À coller dans Supabase → SQL Editor → Run.
-- =====================================================================

alter table public.events disable trigger events_moderation;

update public.events set status = 'published', artist_id = case id
  when 'scene-ouverte-novembre' then null
  else 1
end
where id in ('scene-ouverte-novembre', 'nan-live', 'nan-showcase', 'nan-decembre');

alter table public.events enable trigger events_moderation;

-- Vérification : les 6 événements doivent être « published »
select id, artist_id, status, transit is not null as acces from public.events order by date;

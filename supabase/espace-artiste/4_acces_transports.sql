-- =====================================================================
-- 4. Accès en transports pour les événements
--    Ajoute la colonne « transit » à la table events.
--    À coller dans Supabase → SQL Editor → Run (une seule fois).
--
--    Format enregistré par l'Espace artiste :
--    { "stop": "Narbonne-Plage", "mode": "bus", "lines": ["166", "348D"], "walk": 6 }
--    mode : train, rer, metro, tram ou bus ; walk : minutes de marche depuis l'arrêt
-- =====================================================================

alter table public.events add column if not exists transit jsonb;

-- Les règles existantes (RLS, validation par l'admin) s'appliquent aussi à cette colonne.

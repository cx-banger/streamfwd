-- =====================================================================
-- 4. Accès en transports pour les événements
--    Ajoute la colonne « transit » à la table events.
--    À coller dans Supabase → SQL Editor → Run (une seule fois).
--
--    Format enregistré par l'Espace artiste :
--    { "stop": "Place de Clichy", "legs": [{ "mode": "metro", "lines": ["2", "13"] }, { "mode": "bus", "lines": ["30"] }], "walk": 4 }
--    mode : tgv, train, rer, metro, tram ou bus ; walk : minutes de marche depuis l'arrêt
-- =====================================================================

alter table public.events add column if not exists transit jsonb;

-- Les règles existantes (RLS, validation par l'admin) s'appliquent aussi à cette colonne.

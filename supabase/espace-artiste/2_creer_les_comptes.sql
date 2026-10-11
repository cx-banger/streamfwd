-- =====================================================================
-- ESPACE ARTISTE — relier les comptes aux dossiers
--
-- Les artistes se connectent avec un IDENTIFIANT (ex. « nan »).
-- Supabase exigeant un e-mail, chaque identifiant correspond à une adresse
-- interne :  <identifiant>@artistes.muzikly.app   (jamais affichée, aucun e-mail envoyé)
--
-- Avant ce script, crée chaque compte dans :
--   Supabase → Authentication → Users → « Add user » → « Create new user »
--   E-mail : nan@artistes.muzikly.app   (identifiant + @artistes.muzikly.app)
--   Mot de passe : un mot de passe différent pour chaque artiste
--   Coche « Auto Confirm User »
--
-- Puis ajuste les identifiants ci-dessous si besoin et exécute dans le SQL Editor.
-- Tu peux relancer ce script sans risque (il met à jour les fiches).
-- =====================================================================

insert into public.artist_accounts (user_id, folder, display_name, is_admin)
select u.id, x.folder, x.display_name, x.is_admin
from (values
  -- identifiant  dossier      nom affiché       admin
  ('admin',       'admin',     'Administrateur', true),
  ('nan',         'artiste1',  'NΛN',            false),
  ('synai',       'artiste2',  'Synaï',          false),
  ('elihem',      'artiste3',  'Elihem',         false),
  ('sara',        'artiste4',  'Sara',           false),
  ('eilynn',      'artiste5',  'Eilynn',         false),
  ('melohim',     'artiste6',  'Melohim',        false),
  ('tiim',        'artiste7',  'Tiim',           false),
  ('math',        'artiste8',  'Math',           false),
  ('raph',        'artiste9',  'Raph',           false),
  ('paguiel',     'artiste10', 'Paguiel',        false)
) as x(identifiant, folder, display_name, is_admin)
join auth.users u on lower(u.email) = lower(x.identifiant || '@artistes.muzikly.app')
on conflict (user_id) do update
  set folder = excluded.folder,
      display_name = excluded.display_name,
      is_admin = excluded.is_admin;

-- Vérification : qui est relié à quel dossier
select replace(u.email, '@artistes.muzikly.app', '') as identifiant,
       a.display_name, a.folder, a.is_admin
from public.artist_accounts a join auth.users u on u.id = a.user_id
order by a.folder;

-- Mot de passe oublié par un artiste ?
-- Supabase → Authentication → Users → clique sur le compte → « Reset password »
-- n'envoie rien (adresse interne) : utilise plutôt les « … » du compte → modifier le mot de passe,
-- ou supprime et recrée le compte avec la même adresse (puis relance ce script).

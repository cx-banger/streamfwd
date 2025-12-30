-- Script de test complet pour le système de notification par email
-- Exécutez ces commandes une par une dans l'éditeur SQL de Supabase

-- ==============================================
-- ÉTAPE 1 : Créer un utilisateur de test
-- ==============================================
INSERT INTO users (id, username, email)
VALUES (
  gen_random_uuid(),
  'test_user_' || floor(random() * 1000),
  'votre-email@example.com'  -- IMPORTANT : Remplacez par votre vrai email !
)
RETURNING id, username, email;

-- Notez l'ID retourné et utilisez-le dans les commandes suivantes
-- Remplacez 'VOTRE_USER_ID' par cet ID dans toutes les commandes ci-dessous


-- ==============================================
-- ÉTAPE 2 : Activer les notifications email
-- ==============================================
INSERT INTO email_preferences (user_id, email_enabled)
VALUES (
  'VOTRE_USER_ID',  -- Remplacez par l'ID de l'étape 1
  true
)
RETURNING *;


-- ==============================================
-- ÉTAPE 3 : Vérifier les artistes disponibles
-- ==============================================
SELECT id, name FROM artists ORDER BY name;


-- ==============================================
-- ÉTAPE 4 : Suivre un artiste
-- ==============================================
-- Remplacez VOTRE_USER_ID et choisissez un artiste
INSERT INTO user_follows (user_id, artist_id)
VALUES (
  'VOTRE_USER_ID',
  (SELECT id FROM artists WHERE name = 'NAN' LIMIT 1)
)
RETURNING *;


-- ==============================================
-- ÉTAPE 5 : Créer une nouvelle chanson (déclenche la notification)
-- ==============================================
INSERT INTO songs (title, artist_id, audio_url, cover_url, release_date)
VALUES (
  'Test Song ' || to_char(now(), 'HH24:MI:SS'),
  (SELECT id FROM artists WHERE name = 'NAN' LIMIT 1),
  'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/sons/artiste1/son1.mp3',
  'https://raw.githubusercontent.com/CX-Banger/cx-final-muzikly/main/op/cv/artiste1/cover1.jpg',
  now()
)
RETURNING id, title, artist_id;


-- ==============================================
-- ÉTAPE 6 : Vérifier que la notification a été créée
-- ==============================================
SELECT
  n.id,
  n.message,
  n.is_read,
  n.created_at,
  u.username,
  u.email
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE n.user_id = 'VOTRE_USER_ID'
ORDER BY n.created_at DESC
LIMIT 5;


-- ==============================================
-- ÉTAPE 7 : Vérifier que l'email est en file d'attente
-- ==============================================
SELECT
  eq.id,
  eq.email,
  eq.subject,
  eq.body,
  eq.sent,
  eq.sent_at,
  eq.error,
  eq.created_at
FROM email_queue eq
WHERE eq.user_id = 'VOTRE_USER_ID'
ORDER BY eq.created_at DESC;


-- ==============================================
-- ÉTAPE 8 : Vérifier tous les emails en attente d'envoi
-- ==============================================
SELECT
  eq.id,
  eq.email,
  eq.subject,
  LEFT(eq.body, 100) as body_preview,
  eq.sent,
  eq.created_at,
  u.username
FROM email_queue eq
JOIN users u ON u.id = eq.user_id
WHERE eq.sent = false
ORDER BY eq.created_at DESC;


-- ==============================================
-- COMMANDES DE NETTOYAGE (optionnel)
-- ==============================================

-- Supprimer les données de test
-- DELETE FROM email_queue WHERE user_id = 'VOTRE_USER_ID';
-- DELETE FROM notifications WHERE user_id = 'VOTRE_USER_ID';
-- DELETE FROM user_follows WHERE user_id = 'VOTRE_USER_ID';
-- DELETE FROM email_preferences WHERE user_id = 'VOTRE_USER_ID';
-- DELETE FROM users WHERE id = 'VOTRE_USER_ID';


-- ==============================================
-- COMMANDES DE DIAGNOSTIC
-- ==============================================

-- Voir tous les utilisateurs avec email activé
SELECT
  u.id,
  u.username,
  u.email,
  ep.email_enabled
FROM users u
LEFT JOIN email_preferences ep ON ep.user_id = u.id
WHERE ep.email_enabled = true;

-- Voir les statistiques des emails
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN sent = true THEN 1 END) as sent,
  COUNT(CASE WHEN sent = false THEN 1 END) as pending,
  COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as errors
FROM email_queue;

-- Voir les dernières notifications créées
SELECT
  n.id,
  n.message,
  u.username,
  u.email,
  n.created_at
FROM notifications n
JOIN users u ON u.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 10;

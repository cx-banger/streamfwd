# Espace artiste — mise en service

L'Espace artiste (`#/upload` dans Muzikly) permet à chaque artiste d'envoyer ses sons et ses pochettes
dans **son propre dossier** du bucket `sons` (Supabase, projet `hrzmag…`).
La sécurité est assurée par Supabase lui-même, pas par le navigateur.

## 0. Urgent — régénérer la clé `service_role`

L'ancien dépôt `cx-banger/authd.sdk` publie la clé `service_role` dans son fichier `.env`.
Cette clé donne un contrôle total sur le projet (supprimer tous les sons, lire la base…).

1. Supabase → projet `hrzmag…` → **Settings → API**.
2. Régénère la clé **service_role** (et le **JWT secret** si l'option est proposée).
3. Sur GitHub, rends le dépôt `authd.sdk` **privé** ou **archive-le** : il n'est plus utilisé par Muzikly.
   (Retirer le fichier ne suffit pas : la clé reste dans l'historique, d'où l'étape 2.)

> Si le JWT secret est régénéré, la clé publique `anon` change aussi : il faudra mettre la nouvelle
> dans `src/artistSpace.js` (constante `SONS_ANON_KEY`).

## 1. Fermer l'upload public et activer les règles par dossier

Supabase → **SQL Editor** → **New query** → colle le contenu de `1_securiser_upload.sql` → **Run**.

Le résultat liste les règles actives : « Allow public uploads » ne doit plus y figurer.

## 2. Créer les comptes des artistes (connexion par identifiant)

Les artistes se connectent avec un **identifiant** (ex. `nan`) et un mot de passe.
Supabase exigeant un e-mail, chaque identifiant correspond à une adresse interne
`<identifiant>@artistes.muzikly.app` — jamais affichée, aucun e-mail n'y est envoyé.

1. Supabase → **Authentication → Users → Add user → Create new user**.
2. E-mail : `nan@artistes.muzikly.app` (identifiant + `@artistes.muzikly.app`).
3. Mot de passe : **différent pour chaque artiste**, coche **Auto Confirm User**.
4. Répète pour chaque artiste (et `admin@artistes.muzikly.app` pour toi).

## 3. Relier chaque identifiant à son dossier

Exécute `2_creer_les_comptes.sql` dans le **SQL Editor** (ajuste les identifiants si tu en as choisi d'autres).
Le résultat affiche qui est relié à quel dossier.

| Identifiant | Dossier | Artiste |
|---|---|---|
| `nan` | `artiste1` | NΛN |
| `synai` | `artiste2` | Synaï |
| `elihem` | `artiste3` | Elihem |
| `sara` | `artiste4` | Sara |
| `eilynn` | `artiste5` | Eilynn |
| `melohim` | `artiste6` | Melohim |
| `tiim` | `artiste7` | Tiim |
| `math` | `artiste8` | Math |
| `raph` | `artiste9` | Raph |
| `paguiel` | `artiste10` | Paguiel |
| `admin` | `admin` | peut envoyer dans tous les dossiers |

## 4. Mot de passe oublié

Pas d'e-mail de réinitialisation (adresses internes) : l'artiste te le demande, et tu changes son mot de passe
dans **Authentication → Users** (menu « … » du compte).

## 5. Événements et vidéos gérés par les artistes

Exécute `3_evenements_videos.sql` dans le **SQL Editor**. Il crée les tables `events` et `videos`,
leurs règles d'accès, et importe le contenu actuel du site (déjà publié).

- Un artiste crée / modifie / supprime **ses** événements et **ses** vidéos (onglets « Événements » et « Vidéos »).
- Tout ce qu'il crée ou modifie passe **« En attente »** : c'est Supabase qui l'impose.
- L'**admin** valide ou refuse dans l'onglet **« Validation »** ; ce que l'admin crée est publié directement.
- Le public ne voit que ce qui est **publié**. Si Supabase ne répond pas, l'app affiche le contenu de
  `src/eventsData.js` et `src/videosData.js` (secours).

## Ce que voit l'artiste

- Connexion avec son identifiant et son mot de passe.
- Glisser-déposer (MP3, WAV, OGG, M4A, FLAC, AAC, JPG, PNG, WebP — 50 Mo max) avec barre de progression.
- La liste de ses fichiers, avec possibilité de les supprimer.
- Un fichier qui porte déjà le même nom est refusé (pas d'écrasement accidentel).

Un fichier envoyé n'apparaît pas tout seul dans l'app : pour publier un nouveau titre,
il faut toujours l'ajouter dans `src/script.js` (voir le README principal, « Ajouter un titre »).

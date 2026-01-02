# Site d'Upload PHP vers Supabase Storage

Ce projet consiste en une application web PHP légère et fonctionnelle conçue pour faciliter le transfert sécurisé de fichiers vers un compartiment de stockage Supabase. L'architecture repose sur une approche traditionnelle privilégiant la robustesse et la simplicité de déploiement, tout en intégrant des mécanismes de sécurité essentiels pour protéger les ressources du serveur et du stockage distant.

## Présentation des Fonctionnalités

L'application offre une interface d'authentification centralisée où l'accès est protégé par un mot de passe global défini en configuration. Une fois authentifié, l'utilisateur accède à une interface permettant l'envoi simultané de plusieurs fichiers. Le système intègre une double validation systématique : un premier contrôle est effectué dans le navigateur via JavaScript pour une réactivité optimale, suivi d'une vérification rigoureuse côté serveur en PHP pour garantir l'intégrité des données et le respect des contraintes de sécurité.

| Caractéristique | Spécification |
| :--- | :--- |
| **Authentification** | Session PHP avec mot de passe commun |
| **Types de fichiers** | Images (JPG, PNG, GIF), PDF, Audio (MP3, WAV, OGG) |
| **Limite de taille** | 50 Mo par fichier |
| **Sécurité Storage** | API REST avec clé `service_role` (côté serveur) |
| **Gestion des noms** | Renommage unique automatique (timestamp + hash) |

## Instructions d'Installation et Configuration

Pour mettre en œuvre cette solution, vous devez disposer d'un environnement d'exécution PHP doté de l'extension `curl`. La première étape consiste à préparer votre infrastructure sur la plateforme Supabase en créant un projet et un bucket de stockage nommé par défaut `uploads`. Bien que l'utilisation de la clé `service_role` permette de s'affranchir des politiques RLS pour les opérations d'écriture serveur, il est recommandé de configurer les accès selon vos besoins de lecture futurs.

La configuration logicielle s'effectue exclusivement dans le fichier `config.php`. Vous devrez y renseigner le mot de passe d'accès souhaité ainsi que les paramètres de votre API Supabase. Une fois ces variables éditées, le déploiement se résume à un simple transfert des fichiers sources vers le répertoire racine de votre serveur web.

## Organisation du Projet

Le code source est structuré de manière modulaire pour faciliter la maintenance et d'éventuelles extensions futures. Chaque composant remplit un rôle précis dans le cycle de vie de l'application.

| Fichier | Rôle et Description |
| :--- | :--- |
| `config.php` | Centralise les constantes, les paramètres API et la gestion des sessions. |
| `login.php` | Gère l'interface de connexion et la validation du mot de passe. |
| `upload.php` | Contient le formulaire d'envoi et la logique de transfert vers Supabase. |
| `logout.php` | Assure la fermeture sécurisée de la session utilisateur. |
| `style.css` | Définit l'apparence visuelle minimaliste et fonctionnelle du site. |
| `script.js` | Implémente la logique de validation frontend et le retour utilisateur. |

## Considérations relatives à la Sécurité

La sécurité de l'application repose sur l'isolation de la clé `service_role`, qui n'est jamais transmise au client et reste confinée aux requêtes cURL effectuées par le serveur PHP. Pour prévenir les risques de collision ou d'écrasement de fichiers, chaque élément uploadé est automatiquement renommé en combinant un horodatage précis et une chaîne aléatoire. Bien que le mot de passe soit stocké de manière simplifiée pour ce projet, il est conseillé d'utiliser des fonctions de hachage natives pour un usage en environnement de production.

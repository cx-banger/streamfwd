# Muzikly — ConnexionBanger

Application web d'écoute musicale (gospel, worship, rap chrétien) pour les artistes de ConnexionBanger : pages artistes, recherche, playlists, sons likés, paroles, vidéos « canvas » et nouvelles sorties.

Site en ligne : https://cx-banger.github.io/streamfwd/

## Démarrer en local

Prérequis : Node.js 18 ou plus.

```bash
npm ci          # installe les dépendances
npm run dev     # lance le site sur http://localhost:5173/streamfwd/
```

Copier les variables Supabase dans un fichier `.env` à la racine (il n'est pas versionné) :

```
VITE_SUPABASE_URL=https://<projet>.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon>
```

## Publier

Le site est servi par GitHub Pages depuis le dossier `docs/`.

```bash
npm run build   # reconstruit docs/ à partir de index.html, src/ et public/
```

Puis commit et push de `docs/`.

> **Ne modifie pas `docs/` à la main.** Le dossier est entièrement régénéré à chaque `npm run build`, et toute modification directe y serait perdue. Modifie `index.html`, `src/` ou `public/`, puis reconstruis.

## Structure

| Chemin | Rôle |
|---|---|
| `index.html` | Structure de l'application (pages, lecteur, navigation) |
| `src/script.js` | Catalogue, navigation par URL, pages, recherche, playlists, likes |
| `src/player.js` | Mini-lecteur, lecteur plein écran, canvas vidéo, menu du lecteur |
| `src/upcoming.js` | Vue « Sorties » façon shorts (table Supabase `upcoming_releases`) |
| `src/videoManager.js` | Association titre ↔ vidéo (table Supabase `track_videos`) |
| `src/ui.js` | Toasts, échappement HTML, partage de liens |
| `public/` | Fichiers copiés tels quels dans `docs/` (ex. `video-config.html`) |
| `supabase/migrations/` | Schéma de la base Supabase |

## Navigation (liens partageables)

| URL | Page |
|---|---|
| `#/home` | Accueil |
| `#/search/<texte>` | Recherche |
| `#/playlists`, `#/liked`, `#/upcoming` | Playlists, sons likés, sorties |
| `#/artist/<n>` | Page d'un artiste (n = 1 à 10, ordre de `artistsConfig`) |
| `#/track/<n>/<k>` | Titre k de l'artiste n, prêt à être lu |

## Ajouter un titre

1. Déposer le MP3 dans le stockage Supabase : `sons/artiste<n>/son<k>.mp3`.
2. Déposer la pochette sur GitHub (dépôt `cx-muzik`) : `op/cv/artiste<n>/cover<k>.jpg`.
3. Ajouter le titre à la fin de la bonne ligne de `trackTitles` dans `src/script.js`.
4. Optionnel : paroles dans `cx-muzik/lyr/artiste<n>/son<k>.json`, canvas dans `canvas/artiste<n>/<k>.mp4`.
5. `npm run build`, puis commit et push.

# 🔥 Sorties à venir - Interface Shorts (Type TikTok/Reels)

## Description

Interface immersive verticale type TikTok/Instagram Reels/YouTube Shorts pour présenter les sorties musicales à venir. Une seule vidéo est affichée à la fois en plein écran, avec navigation verticale par swipe.

## Fonctionnalités

### Format Vertical Immersif
- **Une vidéo à la fois** en plein écran (format 9:16)
- **Navigation verticale** : swipe vers le haut pour la suivante, swipe vers le bas pour la précédente
- **Lecture automatique** avec son activé par défaut
- **Lecture en boucle** pour chaque vidéo
- **Scroll snap** : chaque vidéo occupe exactement 100% de l'écran

### Gestion Audio Stricte

#### Règles audio principales :
1. **À l'ouverture du mode Shorts** :
   - La musique en cours dans l'application s'arrête automatiquement
   - La position de lecture est sauvegardée
   - La vidéo démarre avec le son activé

2. **Pendant la navigation** :
   - Lors du swipe, la vidéo précédente s'arrête immédiatement
   - La nouvelle vidéo démarre automatiquement avec le son
   - Pas de chevauchement audio

3. **À la fermeture du mode Shorts** :
   - Option de reprendre la musique là où elle s'était arrêtée
   - Le player principal peut être réactivé selon votre choix

4. **Priorité audio** :
   - Vidéo teaser > Musique application
   - Une seule source audio joue à la fois

### Éléments d'Interface

#### Barre supérieure (overlay avec dégradé)
- **Bouton de fermeture** (gauche) - chevron vers le bas
- **Texte "SORTIES À VENIR"** (centre) - titre de la section
- **Contrôle du volume** (droite) - toggle mute/unmute

#### Carte musicale (bas de l'écran - cliquable)
- Fond semi-transparent avec blur
- **Informations** (gauche) :
  - Titre du morceau
  - Nom de l'artiste
  - Badge de statut (Disponible le... / Disponible maintenant)
- **Avatar de l'artiste** (droite) :
  - Photo de profil arrondie (64x64px)
  - Positionné en haut à droite de la carte
  - Design soigné avec bordure et ombre
- **Clic sur la carte entière** :
  - Si sorti : Ouvre le lien Spotify ou Apple Music
  - Si pas sorti : Feedback visuel de pré-sauvegarde (effet vert)

#### Indicateur de navigation
- Affiché uniquement sur la première vidéo
- Icône chevron vers le haut + texte "Swipe"
- Animation bounce
- Disparaît après le premier scroll

## Utilisation

### Navigation directe en mode immersif
Quand tu cliques sur l'onglet **"Sorties"**, tu arrives **directement** dans le mode vidéo immersif (comme TikTok/Reels), sans passer par une grille de prévisualisation.

### 1. Accéder aux sorties à venir
- Clique sur **"Sorties"** dans la navigation (sidebar ou bottom nav)
- Tu arrives instantanément sur la première vidéo en plein écran
- La musique en cours s'arrête automatiquement

### 2. Navigation dans les vidéos
- **Swipe vers le haut** → vidéo suivante
- **Swipe vers le bas** → vidéo précédente
- **Clic sur la carte musicale** :
  - Si le son est sorti : Ouvre Spotify ou Apple Music
  - Si le son n'est pas encore sorti : Feedback visuel (effet vert)

### 3. Contrôles
- **Volume** (haut droite) : activer/couper le son
- **Fermeture** (haut gauche) : revenir à l'accueil
  - La musique peut reprendre automatiquement si elle était en lecture

### 4. Interface épurée
- Plus de boutons de côté (favoris, playlist, partage)
- Plus de boutons "Pré-sauvegarder" ou "Écouter maintenant" séparés
- Navigation fluide et minimaliste
- Focus total sur la vidéo et l'action principale : découvrir et écouter

## Gestion des contenus

### Table Supabase : `upcoming_releases`

```sql
CREATE TABLE upcoming_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_name text NOT NULL,
  artist_avatar text,
  video_url text NOT NULL,
  cover_url text,
  release_date date,
  is_released boolean DEFAULT false,
  spotify_url text,
  apple_music_url text,
  created_at timestamptz DEFAULT now(),
  order_index integer DEFAULT 0
);
```

### Ajouter une nouvelle sortie

```sql
INSERT INTO upcoming_releases (
  title,
  artist_name,
  artist_avatar,
  video_url,
  release_date,
  is_released,
  spotify_url,
  order_index
) VALUES (
  'Titre du son',
  'Nom Artiste',
  'https://url-vers-avatar.jpg',
  'https://url-vers-video-verticale.mp4',
  '2025-12-31',
  false,
  'https://open.spotify.com/track/xxx',
  1
);
```

### Format vidéo recommandé

#### Spécifications techniques
- **Format** : MP4 (H.264 codec)
- **Ratio** : 9:16 (vertical, portrait)
- **Résolution recommandée** : 1080x1920 (Full HD)
- **Résolution minimale** : 720x1280 (HD)
- **Durée idéale** : 6-15 secondes
- **Durée maximale** : 30 secondes
- **Poids** : < 10MB pour un chargement rapide
- **Framerate** : 30 fps minimum
- **Son** : Activé, mixé avec la musique (preview du morceau)

#### Contenu vidéo recommandé
- Extrait du clip officiel
- Session studio
- Visualizer animé
- Performance live
- Behind the scenes
- Artwork animé

## Stockage des vidéos

### Supabase Storage
Les vidéos doivent être uploadées dans :
- **Bucket** : `videos`
- **Path** : `/upcoming/artist-name-song-title.mp4`
- **Permissions** : Public (lecture seule)
- **URL publique** à copier dans le champ `video_url`

Exemple :
```
https://[votre-projet].supabase.co/storage/v1/object/public/videos/upcoming/nan-summer-vibes.mp4
```

## Design

### Palette de couleurs
- **Barre supérieure** : Dégradé noir transparent + blur 10px
- **Texte "SORTIES À VENIR"** : `rgba(255, 255, 255, 0.7)`
- **Effet de sauvegarde** : Vert transparent `rgba(29, 185, 84, 0.2)` avec bordure verte
- **Badge disponible** : `#fbff60` avec fond transparent
- **Overlay vidéo** : Gradient noir avec transparence
- **Carte musicale** : `rgba(0, 0, 0, 0.85)` + blur 30px
- **Boutons (fermer/volume)** : `rgba(0, 0, 0, 0.6)` + blur 10px
- **Avatar** : Bordure `rgba(255, 255, 255, 0.2)` + ombre

### Animations
- **Bounce** sur l'indicateur de scroll (2s loop)
- **Scale 1.05** au hover des boutons
- **translateY(-4px)** au hover de la carte
- **Scale 0.95** au clic
- **Smooth scroll** entre les vidéos
- **Effet de pulsation** lors de la pré-sauvegarde

### Typographie
- **Titre** : 18px, bold (700)
- **Artiste** : 14px, medium (500)
- **Badge date** : 12px, semi-bold (600)
- **Texte supérieur** : 13px, semi-bold (600), uppercase

## Responsive Design

### Mobile (< 600px)
- Avatar : 56x56px (arrondi 14px)
- Boutons (fermer/volume) : 40x40px
- Texte supérieur : 12px
- Barre supérieure : hauteur 70px
- Padding réduit sur la carte
- Titre : 16px
- Artiste : 13px

### Extra small (< 380px)
- Avatar : 50x50px (arrondi 12px)
- Boutons : 36x36px
- Texte supérieur : 11px
- Titre : 15px
- Artiste : 12px

## Comportement UX

### Scroll naturel
- Snap automatique sur chaque vidéo
- Smooth scroll activé
- Touch-friendly (mobile)
- Inertie naturelle

### Autoplay
- Démarre automatiquement sur la vidéo visible
- S'arrête immédiatement sur les autres
- Gère les restrictions de navigateur
- Fallback si autoplay bloqué

### Partage
- API Web Share si disponible (mobile)
- Fallback : copie du lien (desktop)
- Partage avec titre et description

## Sécurité

### Row Level Security (RLS)
```sql
-- Lecture publique
CREATE POLICY "Anyone can view upcoming releases"
  ON upcoming_releases
  FOR SELECT
  TO public
  USING (true);

-- Pas d'insertion/modification par les utilisateurs
```

### Validation
- URLs validées côté serveur
- Format vidéo vérifié
- Poids limité à l'upload

## Intégration avec le player principal

### Suspension du player
```javascript
// Lors de l'ouverture du mode Shorts
if (audio && !audio.paused) {
  wasPlayingBeforeShorts = true;
  lastPlayedTrack = {
    currentTime: audio.currentTime,
    currentIndex: currentIndex,
    playlist: playlist
  };
  audio.pause();
}
```

### Reprise du player
```javascript
// Lors de la fermeture du mode Shorts
if (wasPlayingBeforeShorts && lastPlayedTrack) {
  audio.currentTime = lastPlayedTrack.currentTime;
  audio.play();
}
```

## Performances

### Optimisations
- Preload : `metadata` uniquement
- Lazy loading des vidéos non visibles
- Pause automatique des vidéos hors écran
- Nettoyage de la mémoire à la fermeture

### Métriques cibles
- Time to Interactive : < 2s
- Changement de vidéo : < 200ms
- Taille bundle CSS : ~8KB gzip
- Taille bundle JS : ~2KB gzip

## Accessibilité

- Contrôle du volume accessible
- Navigation au clavier (flèches haut/bas)
- Textes alternatifs sur les images
- Contraste suffisant sur tous les textes
- Taille tactile minimale : 44x44px

## Analytics (optionnel)

Événements à tracker :
- Ouverture du mode Shorts
- Changement de vidéo (swipe)
- Clic sur carte musicale (pré-sauvegarde ou écoute)
- Ouverture Spotify/Apple Music
- Durée de visionnage par vidéo
- Nombre de vidéos vues par session

## Troubleshooting

### La vidéo ne se lance pas
- Vérifier que l'URL est accessible
- Vérifier le format (MP4 H.264)
- Vérifier les permissions CORS
- Console : voir les erreurs autoplay

### Le son ne fonctionne pas
- Vérifier que le mute est désactivé
- Vérifier les restrictions du navigateur
- Interaction utilisateur requise sur iOS

### Le scroll est saccadé
- Vérifier le poids des vidéos (< 10MB)
- Vérifier la résolution (1080p max)
- Désactiver smooth scroll si problème

## Améliorations futures

- Swipe gesture plus naturel (touch)
- Préchargement de la vidéo suivante
- Analytics avancés
- Recommandations personnalisées
- Mode sombre/clair
- Commentaires
- Réactions animées

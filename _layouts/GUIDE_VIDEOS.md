# Guide de Gestion des Vidéos

Ce guide explique comment associer des vidéos à chaque son dans votre application Muzikly.

## Vue d'ensemble

Chaque son peut avoir une vidéo associée qui sera affichée dans le lecteur complet. Les vidéos sont stockées dans Supabase Storage et les associations sont gérées via une interface dédiée.

## Comment ça fonctionne

1. **Stockage**: Les vidéos sont stockées dans Supabase Storage dans le bucket `videos`
2. **Base de données**: Les associations artiste/chanson/vidéo sont stockées dans la table `track_videos`
3. **Interface**: Une page de gestion permet d'associer facilement les vidéos aux chansons

## Étape 1: Uploader les vidéos dans Supabase Storage

### Via le Dashboard Supabase

1. Connectez-vous à votre projet Supabase: https://supabase.com/dashboard
2. Allez dans **Storage** dans le menu de gauche
3. Sélectionnez le bucket **videos**
4. Cliquez sur **Upload file**
5. Organisez vos vidéos par artiste (recommandé):
   - Créez un dossier pour chaque artiste (ex: `artiste1/`, `artiste2/`)
   - Uploadez les vidéos dans les dossiers respectifs
   - Nommez vos vidéos de manière descriptive (ex: `olala.mp4`, `obsede.mp4`)

### Structure recommandée

```
videos/
├── artiste1/
│   ├── olala.mp4
│   ├── obsede.mp4
│   └── etoile.mp4
├── artiste2/
│   ├── yhwh.mp4
│   └── freestyle-pour-dieu.mp4
└── artiste3/
    └── in-god.mp4
```

## Étape 2: Associer les vidéos aux chansons

1. Dans l'application Muzikly, cliquez sur **Vidéos** dans le menu de gauche
2. Vous verrez la liste de tous les artistes
3. Cliquez sur un artiste pour voir ses chansons
4. Pour chaque chanson:
   - Entrez le chemin de la vidéo dans le champ (ex: `artiste1/olala.mp4`)
   - Cliquez sur le bouton de sauvegarde (icône disquette)
   - Une coche verte apparaîtra si la vidéo est bien associée

## Format des chemins vidéo

Le chemin doit correspondre à l'emplacement du fichier dans le bucket `videos`:

- ✅ **Correct**: `artiste1/olala.mp4`
- ✅ **Correct**: `video-nan-obsede.mp4`
- ❌ **Incorrect**: `/artiste1/olala.mp4` (pas de slash au début)
- ❌ **Incorrect**: `https://...` (pas d'URL complète)

## Formats vidéo supportés

- MP4 (recommandé)
- WebM
- OGG

**Note**: MP4 est le format le plus compatible avec tous les navigateurs.

## Résolution recommandée

Pour une meilleure expérience utilisateur:
- Résolution: 720p (1280x720) ou 1080p (1920x1080)
- Bitrate: 2-4 Mbps
- Codec: H.264

## Vérification

Une fois une vidéo associée:
1. Retournez sur la page d'accueil
2. Lancez la chanson concernée
3. Ouvrez le lecteur complet (cliquez sur le mini-player en bas)
4. La vidéo devrait apparaître en arrière-plan

## Troubleshooting

### La vidéo ne s'affiche pas

1. Vérifiez que le chemin est correct (pas de faute de frappe)
2. Vérifiez que la vidéo existe bien dans le bucket `videos`
3. Vérifiez que le bucket est bien public
4. Essayez de rafraîchir la page

### La vidéo ne charge pas

1. Vérifiez la taille du fichier (max recommandé: 50MB)
2. Vérifiez le format (MP4 recommandé)
3. Testez l'URL directement dans le navigateur: `https://votre-projet.supabase.co/storage/v1/object/public/videos/votre-chemin.mp4`

## Permissions

Seuls les utilisateurs authentifiés peuvent:
- Uploader des vidéos dans Storage
- Associer des vidéos aux chansons

Tous les visiteurs peuvent:
- Voir les vidéos associées aux chansons

## API

Si vous souhaitez gérer les associations par programme:

```javascript
import { supabase } from './supabaseClient.js';
import { saveVideoForTrack, getVideoForTrack } from './videoManager.js';

// Sauvegarder une association
await saveVideoForTrack('NAN', 'Obsédé', 'https://votre-url/videos/artiste1/obsede.mp4');

// Récupérer une vidéo
const videoUrl = await getVideoForTrack('NAN', 'Obsédé');
```

## Notes importantes

1. **Nommage cohérent**: Utilisez des noms d'artistes et de chansons exactement comme ils apparaissent dans l'application
2. **Stockage**: Les vidéos sont stockées dans Supabase Storage, vérifiez votre quota
3. **Performance**: Les vidéos trop lourdes peuvent ralentir le chargement
4. **Cache**: Les vidéos peuvent être mises en cache par le navigateur

## Support

Pour toute question ou problème, vérifiez:
1. Les logs de la console du navigateur (F12)
2. Les permissions du bucket Storage
3. La table `track_videos` dans votre base de données

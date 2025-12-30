# Comment ajouter des vidéos aux chansons

Le système supporte maintenant l'ajout de vidéos pour chaque chanson.

## Méthode

Dans le fichier `src/script.js`, cherche la section où les artistes sont créés (vers la ligne 54).

Pour ajouter une vidéo à une chanson, modifie la propriété `video` de `null` vers l'URL de ta vidéo.

## Exemple

### Avant (sans vidéo):
```javascript
tracks: trackTitles[i].map((title, j) => ({
  id: `son${j+1}`,
  title,
  src: `${SUPABASE_STORAGE_URL}artiste${i+1}/son${j+1}.mp3`,
  cover: `${GITHUB_BASE_URL}/op/cv/artiste${i+1}/cover${j+1}.jpg`,
  canvasId: `artiste${i+1}/${j+1}`,
  video: null
}))
```

### Après (avec vidéo):
```javascript
tracks: trackTitles[i].map((title, j) => {
  // Définis les URLs de vidéos pour certaines chansons
  const videoUrls = {
    '1-1': 'https://ton-url.com/video1.mp4',  // Artiste 1, Chanson 1
    '2-3': 'https://ton-url.com/video2.mp4',  // Artiste 2, Chanson 3
    '5-12': 'https://ton-url.com/video3.mp4'  // Artiste 5, Chanson 12
  };

  const videoKey = `${i+1}-${j+1}`;

  return {
    id: `son${j+1}`,
    title,
    src: `${SUPABASE_STORAGE_URL}artiste${i+1}/son${j+1}.mp3`,
    cover: `${GITHUB_BASE_URL}/op/cv/artiste${i+1}/cover${j+1}.jpg`,
    canvasId: `artiste${i+1}/${j+1}`,
    video: videoUrls[videoKey] || null
  };
})
```

## Format des vidéos

- Format supporté: `.mp4`
- L'URL doit être accessible publiquement (HTTP/HTTPS)
- La vidéo sera affichée dans le player complet (fullscreen)
- Si la vidéo n'existe pas ou ne charge pas, le cover de la chanson sera affiché à la place

## Hébergement des vidéos

Tu peux héberger tes vidéos sur:
- Supabase Storage (recommandé si < 50MB)
- GitHub `mais ne traite pas de fichiers .mp4`
- Tout service d'hébergement qui permet les liens directs (Cloudflare R2, AWS S3, etc.)

### Exemple avec Supabase Storage:
```javascript
video: 'https://ton-projet.supabase.co/storage/v1/object/public/videos/artiste1/video1.mp4'
```

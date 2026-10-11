/* =====================================================================
   VIDÉOS MUZIKLY (clips, teasers, extraits, lives)
   ---------------------------------------------------------------------
   Champs :
   - id        : identifiant unique, utilisé dans l'URL (#/video/<id>)
   - type      : 'clip', 'teaser', 'extrait' ou 'live'
   - artistId  : numéro de l'artiste (1 = NΛN … 10 = Paguiel), ou null
   - title     : titre de la vidéo
   - url       : lien de la vidéo — un fichier .mp4 (ex. Supabase Storage)
                 OU un lien YouTube (https://www.youtube.com/watch?v=… ou youtu.be/…)
   - poster    : image d'aperçu (facultatif : sinon la pochette du titre ou la photo de l'artiste)
   - trackNo   : numéro du titre chez l'artiste, pour reprendre sa pochette (facultatif)
   - date      : 'AAAA-MM-JJ' (date de publication)
   - eventId   : identifiant d'un événement (eventsData.js) — pour un teaser :
                 la fiche de l'événement affichera alors un bouton « Teaser »
   ===================================================================== */

const CANVAS = 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas';

export const VIDEOS = [
  /* --- Extraits : les vraies vidéos « canvas » déjà en ligne sur Supabase --- */
  { id: 'nan-olala', type: 'extrait', artistId: 1, trackNo: 1, title: 'Olala', url: `${CANVAS}/artiste1/1.mp4`, date: '2026-09-01' },
  { id: 'nan-bande', type: 'extrait', artistId: 1, trackNo: 6, title: 'Bande', url: `${CANVAS}/artiste1/6.mp4`, date: '2026-09-01' },
  { id: 'nan-epitre', type: 'extrait', artistId: 1, trackNo: 7, title: 'Epitre Au Monde #1', url: `${CANVAS}/artiste1/7.mp4`, date: '2026-09-01' },
  { id: 'nan-compassion', type: 'extrait', artistId: 1, trackNo: 10, title: 'Compassion', url: `${CANVAS}/artiste1/10.mp4`, date: '2026-09-01' },
  { id: 'synai-yhwh', type: 'extrait', artistId: 2, trackNo: 1, title: 'YHWH', url: `${CANVAS}/artiste2/1.mp4`, date: '2026-09-01' },
  { id: 'elihem-in-god', type: 'extrait', artistId: 3, trackNo: 1, title: 'In God', url: `${CANVAS}/artiste3/1.mp4`, date: '2026-09-01' },
  { id: 'elihem-vise', type: 'extrait', artistId: 3, trackNo: 2, title: 'Visé', url: `${CANVAS}/artiste3/2.mp4`, date: '2026-09-01' },
  { id: 'sara-louange', type: 'extrait', artistId: 4, trackNo: 1, title: 'Louange à Mon Dieu', url: `${CANVAS}/artiste4/1.mp4`, date: '2026-09-01' },
  { id: 'eilynn-cendrillon', type: 'extrait', artistId: 5, trackNo: 1, title: 'Cendrillon', url: `${CANVAS}/artiste5/1.mp4`, date: '2026-09-01' },
  { id: 'melohim-carriere', type: 'extrait', artistId: 6, trackNo: 1, title: 'Ma Carrière', url: `${CANVAS}/artiste6/1.mp4`, date: '2026-09-01' },
  { id: 'tiim-montres-moi', type: 'extrait', artistId: 7, trackNo: 1, title: 'Montres moi', url: `${CANVAS}/artiste7/1.mp4`, date: '2026-09-01' },
  { id: 'raph-zone', type: 'extrait', artistId: 9, trackNo: 1, title: 'Zone à danger', url: `${CANVAS}/artiste9/1.mp4`, date: '2026-09-01' },
  { id: 'paguiel-outro', type: 'extrait', artistId: 10, trackNo: 1, title: 'Outro-Remix', url: `${CANVAS}/artiste10/1.mp4`, date: '2026-09-01' },
  { id: 'paguiel-remix-guitare', type: 'extrait', artistId: 10, trackNo: 2, title: 'Remix guitare', url: `${CANVAS}/artiste10/2.mp4`, date: '2026-09-01' },

  /* --- EXEMPLE de teaser relié à un événement (à titre indicatif) :
         remplace l'url par la vraie vidéo du teaser quand elle existe --- */
  { id: 'teaser-synai-album', type: 'teaser', artistId: 2, title: 'Nouvel album — teaser', url: `${CANVAS}/artiste2/1.mp4`, date: '2026-10-08', eventId: 'synai-album' }

  /* --- Clips et lives : ajoute-les ici, par exemple :
  { id: 'nan-clip-sans-effet', type: 'clip', artistId: 1, trackNo: 21, title: 'Sans Effet (clip officiel)',
    url: 'https://www.youtube.com/watch?v=XXXXXXXXXXX', date: '2026-10-01' },
  --- */
];

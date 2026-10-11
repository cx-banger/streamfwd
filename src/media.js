/* =====================================================================
   MÉDIAS — sons (MP3) et vidéos « canvas »
   Servis par GitHub Pages (dépôt cx-muzik, dossier media/) : bande passante
   bien plus large que l'offre gratuite de Supabase.
   Repli automatique sur Supabase si un fichier n'est pas (encore) sur GitHub,
   par ex. un son tout juste envoyé depuis l'Espace artiste.
   Copie des fichiers : outils/synchroniser-medias.mjs
   ===================================================================== */

export const MEDIA_BASE = 'https://cx-banger.github.io/cx-muzik/media';
const SUPABASE_PUBLIC = 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public';

export const SONS_URL = `${MEDIA_BASE}/sons`;
export const CANVAS_URL = `${MEDIA_BASE}/canvas`;

/* Adresse Supabase équivalente (ou null si l'adresse n'est pas un média GitHub) */
export function supabaseFallback(url) {
  if (typeof url !== 'string' || !url.startsWith(MEDIA_BASE + '/')) return null;
  return SUPABASE_PUBLIC + url.slice(MEDIA_BASE.length);
}

/* Bascule un lecteur (audio ou vidéo) sur Supabase en cas d'erreur, une seule fois,
   en reprenant la lecture si elle était demandée */
export function withFallback(el) {
  if (el.__mediaFallback) return el;
  el.__mediaFallback = true;
  el.addEventListener('error', () => {
    const alt = supabaseFallback(el.currentSrc || el.src);
    if (!alt) return;
    const wasPlaying = !el.paused || el.autoplay;
    el.src = alt;
    if (wasPlaying) el.play().catch(() => {});
  });
  return el;
}

/* Tous les <audio> / <video> de la page (même ajoutés plus tard) :
   les erreurs de média ne remontent pas, on les capture au niveau du document */
export function installMediaFallback() {
  document.addEventListener('error', e => {
    const el = e.target;
    if (!(el instanceof HTMLMediaElement) || el.__mediaFallback) return;
    const alt = supabaseFallback(el.currentSrc || el.src);
    if (!alt) return;
    const wasPlaying = el.autoplay || el.dataset.wantPlay === '1';
    el.src = alt;
    if (wasPlaying || !el.paused) el.play().catch(() => {});
  }, true);

  // play() appelé avant l'erreur : on mémorise l'intention pour relancer après la bascule
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (this.dataset) this.dataset.wantPlay = '1';
    return play.call(this);
  };
  const pause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.pause = function () {
    if (this.dataset) this.dataset.wantPlay = '0';
    return pause.call(this);
  };
}

/* Anciennes adresses Supabase (gardées dans les likes / playlists de l'appareil) → GitHub */
export function preferGithub(url) {
  if (typeof url !== 'string') return url;
  for (const dir of ['/sons/', '/canvas/']) {
    if (url.startsWith(SUPABASE_PUBLIC + dir)) return MEDIA_BASE + url.slice(SUPABASE_PUBLIC.length);
  }
  return url;
}

/* =====================================================================
   VIDÉOS — fil vertical façon Reels / TikTok / Shorts
   - #/videos        : le fil, en commençant par la plus récente
   - #/video/<id>    : le fil, ouvert directement sur cette vidéo
   Une vidéo par écran, défilement vertical aimanté, lecture automatique
   de la vidéo visible, actions à droite, infos en bas à gauche.
   ===================================================================== */

import { VIDEOS } from './videosData.js';
import { escapeHtml, shareLink } from './ui.js';
import { withFallback, preferGithub } from './media.js';

const ms = (name, fill = false) => `<span class="ms${fill ? ' ms-fill' : ''}">${name}</span>`;

export const VIDEO_TYPES = {
  clip:    { label: 'Clip',    plural: 'Clips' },
  teaser:  { label: 'Teaser',  plural: 'Teasers' },
  extrait: { label: 'Extrait', plural: 'Extraits' },
  live:    { label: 'Live',    plural: 'Lives' }
};

let filter = 'all';
let muted = false;          // le son joue toujours ; sourdine provisoire seulement si le navigateur bloque
let unlocking = false;
let observer = null;
let current = null;         // diapo actuellement à l'écran

/* Les extraits (« canvas ») sont muets : on joue le titre de l'artiste à la place,
   comme le son d'un Reel. Un seul lecteur réutilisé pour tout le fil. */
const feedAudio = withFallback(new Audio());
feedAudio.loop = true;
feedAudio.preload = 'auto';

/* ---------- Données ---------- */
const artistOf = v => (window.artists || []).find(a => a.id === v.artistId) || null;
const trackOf = v => { const a = artistOf(v); return a && v.trackNo ? a.tracks[v.trackNo - 1] || null : null; };
const trackSrc = t => preferGithub(Array.isArray(t.src) ? t.src[0] : t.src);
/* Son du titre pour les extraits (vidéos sans piste audio) ; les clips, teasers et lives gardent leur propre son */
const usesTrackSound = v => v.type === 'extrait' && !!trackOf(v) && !youtubeId(v.url);
const posterOf = v => v.poster || trackOf(v)?.cover || artistOf(v)?.photo || '';
function youtubeId(url) {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}
const sortedVideos = () => VIDEOS.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
export function findVideo(id) { return VIDEOS.find(v => v.id === id) || null; }
export function videoForEvent(eventId) { return VIDEOS.find(v => v.eventId === eventId) || null; }

/* J'aime (mémorisés sur l'appareil) */
const getLikes = () => { try { return JSON.parse(localStorage.getItem('videoLikes') || '[]'); } catch { return []; } };
const isLikedVideo = id => getLikes().includes(id);
function toggleLikeVideo(id) {
  const likes = getLikes();
  const i = likes.indexOf(id);
  if (i >= 0) likes.splice(i, 1); else likes.push(id);
  try { localStorage.setItem('videoLikes', JSON.stringify(likes)); } catch {}
  return i < 0;
}

/* ---------- Fil ---------- */
export function renderVideosPage(container, openId = null) {
  observer?.disconnect();
  current = null;
  feedAudio.pause();
  if (window.audio && !window.audio.paused) window.audio.pause();

  const all = sortedVideos();
  if (openId && !all.some(v => v.id === openId)) openId = null;
  if (openId && filter !== 'all' && findVideo(openId)?.type !== filter) filter = 'all';
  const list = all.filter(v => filter === 'all' || v.type === filter);
  const counts = Object.fromEntries(Object.keys(VIDEO_TYPES).map(k => [k, all.filter(v => v.type === k).length]));

  container.innerHTML = `
    <div class="sh-feed" tabindex="-1">
      <nav class="sh-tabs" aria-label="Type de vidéo">
        <button type="button" class="${filter === 'all' ? 'on' : ''}" data-filter="all">Pour toi</button>
        ${Object.entries(VIDEO_TYPES).filter(([k]) => counts[k]).map(([k, t]) => `
          <button type="button" class="${filter === k ? 'on' : ''}" data-filter="${k}">${t.plural}</button>`).join('')}
      </nav>
      ${list.length ? list.map(slide).join('') : '<div class="sh-empty">Aucune vidéo pour le moment.</div>'}
      <div class="sh-nav" aria-hidden="true">
        <button type="button" data-step="-1" aria-label="Vidéo précédente">${ms('keyboard_arrow_up')}</button>
        <button type="button" data-step="1" aria-label="Vidéo suivante">${ms('keyboard_arrow_down')}</button>
      </div>
      <a class="sh-admin" href="#/videos/admin" aria-label="Gérer les vidéos des titres" title="Gérer les vidéos des titres">${ms('settings')}</a>
    </div>`;

  const feed = container.querySelector('.sh-feed');

  // Filtres
  feed.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.filter;
    history.replaceState(null, '', '#/videos');
    renderVideosPage(container);
  }));

  // Flèches (ordinateur) et clavier
  const step = dir => feed.scrollBy({ top: dir * feed.clientHeight, behavior: 'smooth' });
  feed.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => step(Number(b.dataset.step))));
  feed.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
  });

  // Interactions sur chaque vidéo
  feed.querySelectorAll('.sh-slide').forEach(s => wireSlide(s));

  // Lecture automatique de la vidéo visible, pause des autres
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const s = entry.target;
      const vid = s.querySelector('video');
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        if (current === s) return;
        current = s;
        playSlide(s);
        if (location.hash !== `#/video/${s.dataset.id}`) history.replaceState(null, '', `#/video/${s.dataset.id}`);
        document.title = `${s.dataset.title} - Muzikly`;
      } else if (entry.intersectionRatio < 0.6) {
        if (vid) { vid.pause(); }
        if (s.dataset.yt) s.querySelector('iframe')?.remove();
        if (current === s) { current = null; feedAudio.pause(); }
      }
    });
  }, { root: feed, threshold: [0, 0.6, 1] });
  feed.querySelectorAll('.sh-slide').forEach(s => observer.observe(s));

  // Ouvre directement une vidéo
  if (openId) {
    const target = feed.querySelector(`.sh-slide[data-id="${CSS.escape(openId)}"]`);
    if (target) feed.scrollTop = target.offsetTop;
  }
  feed.focus({ preventScroll: true });
}

function slide(v) {
  const a = artistOf(v);
  const t = VIDEO_TYPES[v.type] || VIDEO_TYPES.extrait;
  const yt = youtubeId(v.url);
  const liked = isLikedVideo(v.id);
  return `
    <section class="sh-slide" data-id="${escapeHtml(v.id)}" data-title="${escapeHtml(v.title)}"${yt ? ` data-yt="${yt}"` : ''}>
      <div class="sh-media">
        ${posterOf(v) ? `<img class="sh-poster" src="${posterOf(v)}" alt="" loading="lazy">` : ''}
        ${yt ? '' : `<video src="${escapeHtml(v.url)}" poster="${posterOf(v)}" loop playsinline preload="metadata" muted></video>`}
        <span class="sh-paused-icon" aria-hidden="true">${ms('play_arrow', true)}</span>
      </div>
      <div class="sh-shade"></div>

      <aside class="sh-actions">
        <button type="button" class="sh-act${liked ? ' on' : ''}" data-act="like" aria-label="J'aime">${ms('favorite', liked)}<span>J'aime</span></button>
        <button type="button" class="sh-act" data-act="share" aria-label="Partager">${ms('share', true)}<span>Partager</span></button>
        ${trackOf(v) ? `<button type="button" class="sh-act" data-act="listen" aria-label="Écouter le titre">${ms('music_note', true)}<span>Écouter</span></button>` : ''}
        ${a ? `<a class="sh-avatar" href="#/artist/${a.id}" aria-label="Voir ${escapeHtml(a.name)}"><img src="${a.photo}" alt=""></a>` : ''}
      </aside>

      <div class="sh-info">
        ${a ? `<a class="sh-artist" href="#/artist/${a.id}"><img src="${a.photo}" alt=""><strong>${escapeHtml(a.name)}</strong></a>` : '<span class="sh-artist"><strong>Muzikly</strong></span>'}
        <p class="sh-title"><span class="sh-type sh-type-${v.type}">${t.label}</span>${escapeHtml(v.title)}</p>
        ${v.eventId ? `<a class="sh-chip" href="#/event/${encodeURIComponent(v.eventId)}">${ms('event')}Voir l'événement</a>` : ''}
        ${trackOf(v) ? `<span class="sh-sound">${ms('music_note')}<span>${escapeHtml(trackOf(v).title)} · ${escapeHtml(a.name)}</span></span>` : ''}
      </div>
    </section>`;
}

function mountYouTube(s) {
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${s.dataset.yt}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${s.dataset.yt}&playsinline=1&rel=0&modestbranding=1`;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
  iframe.title = s.dataset.title;
  s.querySelector('.sh-media').appendChild(iframe);
}

/* Lance la diapo visible : image + son (le titre de l'artiste pour un extrait, sinon le son de la vidéo) */
function playSlide(s) {
  const v = findVideo(s.dataset.id);
  const vid = s.querySelector('video');
  s.classList.remove('paused');
  if (s.dataset.yt) { if (!s.querySelector('iframe')) mountYouTube(s); return; }

  if (v && usesTrackSound(v)) {
    if (vid) { vid.muted = true; vid.play().catch(() => {}); }
    const src = trackSrc(trackOf(v));
    if (feedAudio.dataset.src !== src) {
      feedAudio.src = src;
      feedAudio.dataset.src = src;
      feedAudio.currentTime = v.start || 0;
    }
    feedAudio.muted = muted;
    feedAudio.play().catch(blocked);
  } else {
    feedAudio.pause();
    if (!vid) return;
    vid.muted = muted;
    vid.play().catch(() => { blocked(); vid.muted = true; vid.play().catch(() => {}); });
  }
}

/* Le navigateur refuse le son sans geste de l'utilisateur (ouverture par un lien direct) :
   on passe en sourdine, et le premier toucher sur la page remet le son. */
function blocked() {
  if (muted) return;
  setMuted(true);
  const unlock = () => {
    ['pointerdown', 'keydown'].forEach(t => document.removeEventListener(t, unlock, true));
    if (!document.body.classList.contains('vd-mode')) return;
    setMuted(false);
    if (!current) return;
    // ce toucher sert à remettre le son : il ne doit pas aussi mettre la vidéo en pause
    unlocking = true;
    setTimeout(() => { unlocking = false; }, 500);
    if (current.dataset.yt) current.querySelector('iframe')?.remove();
    playSlide(current);
  };
  ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, unlock, true));
}

function setMuted(on) {
  muted = on;
  feedAudio.muted = on;
  document.querySelectorAll('.sh-slide video').forEach(x => {
    const v = findVideo(x.closest('.sh-slide').dataset.id);
    x.muted = on || (v && usesTrackSound(v));
  });
}

function wireSlide(s) {
  const v = findVideo(s.dataset.id);
  const vid = s.querySelector('video');

  // Toucher la vidéo : pause / lecture (image et son ensemble)
  s.querySelector('.sh-media').addEventListener('click', () => {
    if (!vid || unlocking) return;
    if (s.classList.contains('paused')) playSlide(s);
    else { vid.pause(); if (usesTrackSound(v)) feedAudio.pause(); s.classList.add('paused'); }
  });

  s.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const act = b.dataset.act;
    if (act === 'like') {
      const on = toggleLikeVideo(v.id);
      b.classList.toggle('on', on);
      b.querySelector('.ms').classList.toggle('ms-fill', on);
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    }
    if (act === 'share') {
      const a = artistOf(v);
      shareLink({ title: v.title, text: `${v.title}${a ? ` — ${a.name}` : ''} sur Muzikly`, url: `${location.origin}${location.pathname}#/video/${v.id}` });
    }
    if (act === 'listen') {
      // Ouvre le titre dans le lecteur, en reprenant là où en était l'extrait
      const a = artistOf(v);
      const at = usesTrackSound(v) && feedAudio.dataset.src === trackSrc(trackOf(v)) ? feedAudio.currentTime : 0;
      stopVideos();
      window.playlist = a.tracks.map(x => window.toQueueItem(a, x));
      window.loadAndPlay(v.trackNo - 1);
      if (at > 1) {
        const seek = () => { window.audio.currentTime = at; };
        if (window.audio.readyState >= 1) seek();
        else window.audio.addEventListener('loadedmetadata', seek, { once: true });
      }
      location.hash = `#/artist/${a.id}`;
      window.openFullPlayer?.();
    }
  }));
}

/* Quand on quitte la page Vidéos : arrêter les vidéos et leur son */
export function stopVideos() {
  observer?.disconnect();
  current = null;
  feedAudio.pause();
  document.querySelectorAll('.sh-slide video').forEach(v => v.pause());
  document.querySelectorAll('.sh-slide iframe').forEach(f => f.remove());
}

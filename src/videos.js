/* =====================================================================
   VIDÉOS — fil vertical façon Reels / TikTok / Shorts
   - #/videos        : le fil, en commençant par la plus récente
   - #/video/<id>    : le fil, ouvert directement sur cette vidéo
   Une vidéo par écran, défilement vertical aimanté, lecture automatique
   de la vidéo visible, actions à droite, infos en bas à gauche.
   ===================================================================== */

import { VIDEOS } from './videosData.js';
import { escapeHtml, shareLink, showToast } from './ui.js';

const ms = (name, fill = false) => `<span class="ms${fill ? ' ms-fill' : ''}">${name}</span>`;

export const VIDEO_TYPES = {
  clip:    { label: 'Clip',    plural: 'Clips' },
  teaser:  { label: 'Teaser',  plural: 'Teasers' },
  extrait: { label: 'Extrait', plural: 'Extraits' },
  live:    { label: 'Live',    plural: 'Lives' }
};

let filter = 'all';
let muted = true;           // les navigateurs n'autorisent la lecture auto qu'en sourdine
let observer = null;

/* ---------- Données ---------- */
const artistOf = v => (window.artists || []).find(a => a.id === v.artistId) || null;
const trackOf = v => { const a = artistOf(v); return a && v.trackNo ? a.tracks[v.trackNo - 1] || null : null; };
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
      if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
        if (vid) { vid.muted = muted; vid.play().catch(() => {}); s.classList.remove('paused'); }
        if (s.dataset.yt && !s.querySelector('iframe')) mountYouTube(s);
        if (location.hash !== `#/video/${s.dataset.id}`) history.replaceState(null, '', `#/video/${s.dataset.id}`);
        document.title = `${s.dataset.title} - Muzikly`;
      } else {
        if (vid) { vid.pause(); }
        if (s.dataset.yt) s.querySelector('iframe')?.remove();
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
        <button type="button" class="sh-act" data-act="sound" aria-label="Son">${ms(muted ? 'volume_off' : 'volume_up', true)}<span>${muted ? 'Son' : 'Couper'}</span></button>
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

function wireSlide(s) {
  const v = findVideo(s.dataset.id);
  const vid = s.querySelector('video');

  // Toucher la vidéo : pause / lecture
  s.querySelector('.sh-media').addEventListener('click', () => {
    if (!vid) return;
    if (vid.paused) { vid.play().catch(() => {}); s.classList.remove('paused'); }
    else { vid.pause(); s.classList.add('paused'); }
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
    if (act === 'sound') {
      muted = !muted;
      document.querySelectorAll('.sh-slide video').forEach(x => { x.muted = muted; });
      document.querySelectorAll('.sh-act[data-act="sound"]').forEach(x => {
        x.querySelector('.ms').textContent = muted ? 'volume_off' : 'volume_up';
        x.querySelector('span:last-child').textContent = muted ? 'Son' : 'Couper';
      });
      if (s.dataset.yt) { s.querySelector('iframe')?.remove(); mountYouTube(s); }
      showToast(muted ? 'Son coupé' : 'Son activé', { icon: muted ? 'volume_off' : 'volume_up' });
    }
    if (act === 'share') {
      const a = artistOf(v);
      shareLink({ title: v.title, text: `${v.title}${a ? ` — ${a.name}` : ''} sur Muzikly`, url: `${location.origin}${location.pathname}#/video/${v.id}` });
    }
    if (act === 'listen') {
      const a = artistOf(v);
      if (vid) vid.pause();
      window.playlist = a.tracks.map(x => ({ src: x.src, title: x.title, artist: a.name, thumb: x.cover || a.photo, canvasId: x.canvasId, video: x.video }));
      window.loadAndPlay(v.trackNo - 1);
    }
  }));
}

/* Quand on quitte la page Vidéos : arrêter les vidéos */
export function stopVideos() {
  observer?.disconnect();
  document.querySelectorAll('.sh-slide video').forEach(v => v.pause());
  document.querySelectorAll('.sh-slide iframe').forEach(f => f.remove());
}

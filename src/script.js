/* ========= Fusion JS (artistes + albums + lecteur + playlists + recherche) ========= */

import { initVideoManager, loadAllVideos } from './videoManager.js';
import { initUpcomingShorts, handleUpcomingPageOpen, closeUpcomingIfOpen } from './upcoming.js';
import { showToast, escapeHtml, shareLink } from './ui.js';
import { renderPlaylistScreen, removedToast } from './playlistView.js';
import { renderEventsHome, renderEventDetail, renderArtistEvents, renderUpcomingSection, renderArtistEventBadge } from './events.js';

/* === Configuration des ressources === */
// URL de base pour les images hébergées sur GitHub
// Option 1: GitHub Pages (recommandé si activé)
// const GITHUB_BASE_URL = 'https://cx-banger.github.io/cx-muzik/main';
// Option 2: GitHub raw (fallback)
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/CX-Banger/cx-muzik/main';

// URL de base pour les fichiers audio hébergés sur Supabase Storage
const SUPABASE_STORAGE_URL = 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/sons/';

// URL de base pour les paroles hébergées sur GitHub
const LYRICS_BASE_URL = 'https://raw.githubusercontent.com/CX-Banger/cx-muzik/main/lyr';

// URL de base pour les canvas hébergés sur Supabase Storage
const SUPABASE_CANVAS_URL = 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas';

/* === Artistes avec couleurs personnalisées === */
const artistsConfig = [
  { name: 'NΛN', bgColor: '#2a1a1a', bgColorHover: '#4a2a2a', badges: ['yt-artist-channel', 'won_a_competition'] },
  { name: 'Synaï', bgColor: '#1a2a3a', bgColorHover: '#2a4a6a', badges: ['interviewed', 'write'] },
  { name: 'Elihem', bgColor: '#1a3a2a', bgColorHover: '#2a6a4a', badges: ['podcast', 'write', 'maintenance'] },
  { name: 'Sara', bgColor: '#3a2a1a', bgColorHover: '#6a4a2a', badges: ['interviewed', 'speed'] },
  { name: 'Eilynn', bgColor: '#2a1a3a', bgColorHover: '#4a2a6a', badges: ['write', 'podcast'] },
  { name: 'Melohim', bgColor: '#1a3a3a', bgColorHover: '#2a6a6a', badges: ['podcast', 'interviewed'] },
  { name: 'Tiim', bgColor: '#3a3a1a', bgColorHover: '#6a6a2a', badges: ['interviewed'] },
  { name: 'Math', bgColor: '#2a3a1a', bgColorHover: '#4a6a2a', badges: ['website-offline'] },
  { name: 'Raph', bgColor: '#3a1a1a', bgColorHover: '#6a2a2a', badges: ['write', 'interviewed'] },
  { name: 'Paguiel', bgColor: '#1a1a3a', bgColorHover: '#2a2a6a', badges: ['maintenance', 'maintain_champion'] }
];

const trackTitles = [
  ['Olala', 'Obsédé', 'Etoile', 'Parapluie', 'Love Story', 'Bande', 'Epitre Au Monde #1', 'Mieux', 'Alchimie', 'Compassion', 'Génant', 'Techiyá', 'Kesse', 'Psaumes 151', 'Pourquoi', 'Dispo', 'En Tout Temps', 'Génération', 'Favelas', 'Chemin ft Elihem', 'Sans Effet', 'Victoire ft Eilynn'],
  ['YHWH', 'Freestyle Pour Dieu', 'Zinzin', 'Choisir Papa', 'Le Temps', 'Une Question...', 'Papa Yahweh ft Eilynn', 'Saisir les Bases', 'Dessin', 'Cri du Coeur ft Sara', 'Chargeur Plein', 'The King ft Elihem', 'Je t aime ft Sara', 'Muy Bonito ft Eilynn'],
  ['In God', 'Visé', 'Minimum', 'Can you hear me ?', 'Evidemment', 'The King ft Synaï', 'Chemin ft NΛN', 'Kill My Flesh ft Eilynn'],
  ['Louange à Mon Dieu', 'Tentation', 'Dis moi ft Eilynn', 'Evangéliser', 'Je t aime ft Synaï', 'Cri du Coeur ft Synaï'],
  ['Cendrillon', 'Nouveau Départ', 'Victoire ft NΛN', 'Ta Présence', 'A chaque jour', 'Je te retrouverai', 'Flame of Life', 'Papa Yahweh ft Synaï', 'Dis moi ft Sara', 'Muy Bonito ft Synaï', 'Sé ou épi mwen', 'Kill My Flesh ft Elihem'],
  ['Ma Carrière', 'Porter Du Fruit', 'Mourir à moi même', 'Mon Histoire', '10.10.2025'],
  ['Montres moi', 'Intro', 'Impro Prt1'],
  ['Math 1', 'Math 2', 'Math 3', 'Math 4', 'Math 5'],
  ['Zone à danger', 'Raph2'],
  [/* 'A la Fontaine', 'Combat dans la Lumière', */ 'Outro-Remix', 'Remix guitare']
];

let artists = artistsConfig.map((config, i) => ({
  id: i + 1,
  name: config.name,
  bio: config.name,
  photo: `${GITHUB_BASE_URL}/op/pp/${i+1}.jpg`,
  bgColor: config.bgColor,
  bgColorHover: config.bgColorHover,
  badges: config.badges,
  tracks: trackTitles[i].map((title, j) => ({
    id: `son${j+1}`,
    title,
    src: `${SUPABASE_STORAGE_URL}artiste${i+1}/son${j+1}.mp3`,
    cover: `${GITHUB_BASE_URL}/op/cv/artiste${i+1}/cover${j+1}.jpg`,
    canvasId: `artiste${i+1}/${j+1}`,
    video: null
  }))
}));

async function loadVideosForArtists() {
  const videos = await loadAllVideos();
  const videosMap = new Map();
  videos.forEach(v => {
    videosMap.set(`${v.artist_name}::${v.track_title}`, v.video_url);
  });

  artists.forEach(artist => {
    artist.tracks.forEach(track => {
      const key = `${artist.name}::${track.title}`;
      if (videosMap.has(key)) {
        track.video = videosMap.get(key);
      }
    });
  });
}


/* Convertit un titre du catalogue en entrée de file de lecture */
function toQueueItem(artist, track) {
  return {
    src: Array.isArray(track.src) ? track.src[0] : track.src,
    title: track.title,
    artist: artist.name,
    thumb: track.cover || artist.photo,
    canvasId: track.canvasId,
    video: track.video
  };
}

/* === DOM refs === */
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.nav-btn[data-page]');
const bottomBtns = document.querySelectorAll('.bottom-nav .bt');
const artistsGrid = document.getElementById('artistsGrid');
const upcomingDiv = document.getElementById('upcoming');
const playlistListDiv = document.getElementById('playlistList');
const playlistTracksDiv = document.getElementById('playlistTracks');
const likedTracksDiv = document.getElementById('likedTracks');
const searchInput = document.getElementById('searchInput');
const searchResultsDiv = document.getElementById('searchResults');
const headerSearch = document.getElementById('headerSearch');
const newPlaylistNameInput = document.getElementById('newPlaylistName');
const createPlaylistBtn = document.getElementById('createPlaylistBtn');

/* Player refs */
const audio = document.getElementById('audio');

/* Artist page refs */
const artistPageName = document.getElementById('artistPageName');
const artistPageBio = document.getElementById('artistPageBio');
const artistTracksList = document.getElementById('artistTracksList');
const artistPlayBtn = document.getElementById('artistPlayBtn');
const artistPageBanner = document.querySelector('.artist-page-banner');
window.currentArtistData = null;

/* state */
window.userPlaylists = JSON.parse(localStorage.getItem('playlists') || '{}');
window.likedSongs = window.userPlaylists['Sons Likés'] || [];
window.playlist = [];
window.currentIndex = 0;
window.isShuffle = false;
window.isRepeat = false;

/* ===== Navigation =====
   Chaque page a sa propre URL (#/home, #/search, #/artist/3, #/track/3/5...),
   ce qui rend le bouton retour fonctionnel et les liens partageables. */
function renderPage(id){
  pages.forEach(p=>p.classList.remove('active'));
  const targetPage = document.getElementById('page-' + id);
  if(targetPage) targetPage.classList.add('active');
  navBtns.forEach(b=>b.classList.toggle('active', b.dataset.page === id));
  bottomBtns.forEach(b=>b.classList.toggle('active', b.dataset.page === id));
  document.querySelector('.pages')?.scrollTo(0, 0);
  if (id !== 'artist') document.title = 'Muzikly - ConnexionBanger';

  if (id === 'videos') {
    initVideoManager(artists);
  }
}

function navigate(path){
  const hash = '#' + path;
  if (location.hash === hash) route();
  else location.hash = hash;
}

function showPage(id){
  navigate('/' + id);
}

function findArtist(id){
  return artists.find(a => String(a.id) === String(id));
}

function route(){
  const [page = 'home', ...params] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);

  if (page !== 'upcoming') closeUpcomingIfOpen();

  if (page === 'artist') {
    const artist = findArtist(params[0]);
    if (artist) return openArtist(artist);
  }

  if (page === 'track') {
    const artist = findArtist(params[0]);
    const idx = parseInt(params[1], 10) - 1;
    if (artist && artist.tracks[idx]) {
      openArtist(artist);
      // Le navigateur bloque la lecture automatique : on prépare le titre, l'utilisateur lance la lecture
      window.playlist = artist.tracks.map(t => toQueueItem(artist, t));
      window.currentIndex = idx;
      loadTrack(idx);
      updatePlayingState();
      return;
    }
  }

  // Événements (façon Shazam) : accueil, fiche, liste d'un artiste
  const eventsPage = document.getElementById('page-upcoming');
  document.body.classList.toggle('pl-mode', page === 'liked' || page === 'playlist');
  document.body.classList.toggle('events-mode', ['upcoming', 'event', 'events'].includes(page));
  if (page === 'upcoming') {
    renderEventsHome(eventsPage);
    renderPage('upcoming');
    return;
  }
  if (page === 'event' && params[0]) {
    renderEventDetail(eventsPage, params[0]);
    renderPage('upcoming');
    return;
  }
  if (page === 'events' && params[0] === 'artist') {
    renderArtistEvents(eventsPage, params[1]);
    renderPage('upcoming');
    return;
  }

  if (page === 'search' && params[0]) {
    renderPage('search');
    searchInput.value = params[0];
    doSearch(params[0]);
    return;
  }

  if (page === 'liked') {
    renderLikedTracks();
    renderPage('liked');
    return;
  }
  if (page === 'playlist' && params[0]) {
    renderOpenPlaylist(params[0]);
    renderPage('playlist');
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.page === 'playlists'));
    bottomBtns.forEach(b => b.classList.toggle('active', b.dataset.page === 'playlists'));
    return;
  }

  const known = ['home', 'search', 'playlists', 'liked', 'upcoming', 'videos'];
  renderPage(known.includes(page) ? page : 'home');
}

window.addEventListener('hashchange', route);

bottomBtns.forEach(b=>{
  b.addEventListener('click', ()=> showPage(b.dataset.page));
});

document.querySelectorAll('[data-soon]').forEach(b=>{
  b.addEventListener('click', ()=> showToast(`${b.dataset.soon} arrive bientôt !`, { icon: 'hourglass_top' }));
});

/* La recherche du bandeau ouvre la page Recherche et met à jour l'URL sans empiler l'historique */
headerSearch.addEventListener('input', e=>{
  const q = e.target.value.trim();
  if(q.length>=2){
    if (!document.getElementById('page-search').classList.contains('active')) renderPage('search');
    searchInput.value = q;
    doSearch(q);
    history.replaceState(null, '', '#/search/' + encodeURIComponent(q));
  }
});

/* ===== Badge URLs ===== */
const BADGE_BASE_URL = 'https://raw.githubusercontent.com/CX-Banger/unordered_set/9dbac3ece6711aeb7e41c402c1748b35b92a471f/icons-badges';

function getBadgesHTML(badges) {
  if (!badges || badges.length === 0) return '';

  const badgeElements = badges.map(badgeFileName => {
    const badgeUrl = `${BADGE_BASE_URL}/${badgeFileName}.svg`;
    return `<span class="artist-badge" title="${badgeFileName}"><img src="${badgeUrl}" alt="" loading="lazy" onerror="this.parentElement.remove()"></span>`;
  }).join('');

  return `<div class="artist-badges">${badgeElements}</div>`;
}

/* ===== Render artistes ===== */
function renderArtists(){
  artistsGrid.replaceChildren(...artists.map(createArtistCircle));
}

function trackCountLabel(a) {
  return `${a.tracks.length} titre${a.tracks.length > 1 ? 's' : ''}`;
}

/* Carte ronde d'artiste (photo ronde, nom, nombre de titres) */
function createArtistCircle(a) {
  const card = document.createElement('a');
  card.className = 'artist-circle';
  card.href = `#/artist/${a.id}`;
  card.innerHTML = `
    <img src="${a.photo}" alt="" loading="lazy">
    <span class="artist-circle-name">${escapeHtml(a.name)}</span>
    <span class="artist-circle-sub">${trackCountLabel(a)}</span>
  `;
  return card;
}

/* ===== Page Recherche : vue par défaut (avant de taper) ===== */
// Sélection éditoriale : [artiste, titre] tels qu'ils apparaissent dans trackTitles
const featuredPicks = [
  ['Eilynn', 'Kill My Flesh ft Elihem'],
  ['Tiim', 'Intro'],
  ['Raph', 'Zone à danger'],
  ['Synaï', 'Muy Bonito ft Eilynn'],
  ['Elihem', 'Kill My Flesh ft Eilynn'],
  ['Sara', 'Je t aime ft Synaï'],
  ['NΛN', 'Sans Effet'],
  ['Melohim', 'Ma Carrière']
];

function findTrack(artistName, title) {
  const artist = artists.find(a => a.name === artistName);
  const track = artist?.tracks.find(t => t.title === title);
  return artist && track ? { artist, track } : null;
}

function createAlbumCard({ artist, track }) {
  const card = document.createElement('div');
  card.className = 'search-album-card';
  card.innerHTML = `
    <div class="cover-wrap">
      <img src="${track.cover}" alt="${escapeHtml(track.title)}" loading="lazy">
      <span class="card-play" aria-hidden="true"><span class="ms ms-fill">play_arrow</span></span>
    </div>
    <div class="search-album-info">
      <div class="search-album-title">${escapeHtml(track.title)}</div>
      <div class="search-album-artist">${escapeHtml(artist.name)} • Titre</div>
    </div>
  `;
  card.addEventListener('click', () => {
    window.playlist = artist.tracks.map(t => toQueueItem(artist, t));
    loadAndPlay(artist.tracks.indexOf(track));
  });
  return card;
}

/* ===== Accueil façon YouTube Music ===== */
let homeFilter = null; // null = « Tout », sinon l'id de l'artiste choisi dans les puces

function allTracks() {
  return artists.flatMap(a => a.tracks.map(t => ({ artist: a, track: t })));
}

/* Mélange stable (le même chaque jour) pour que la « Sélection rapide » change d'un jour à l'autre */
function dailyShuffle(list) {
  let seed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  return list.map(x => [rand(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem('history') || '[]'); } catch { return []; }
}

function renderHome() {
  // Puces de filtre : « Tout » puis chaque artiste
  const chips = document.getElementById('homeChips');
  const makeChip = (label, id) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (homeFilter === id ? ' selected' : '');
    chip.textContent = label;
    chip.addEventListener('click', () => { homeFilter = id; renderHome(); });
    return chip;
  };
  chips.replaceChildren(makeChip('Tout', null), ...artists.map(a => makeChip(a.name, a.id)));

  const pool = homeFilter === null ? allTracks() : allTracks().filter(x => x.artist.id === homeFilter);

  // Écouter à nouveau : l'historique d'écoute, sinon la sélection éditoriale
  const history = getHistory()
    .map(h => findTrack(h.artist, h.title))
    .filter(Boolean)
    .filter(x => homeFilter === null || x.artist.id === homeFilter);
  const fallback = featuredPicks.map(([an, ti]) => findTrack(an, ti)).filter(Boolean)
    .filter(x => homeFilter === null || x.artist.id === homeFilter);
  const again = (history.length ? history : (fallback.length ? fallback : pool)).slice(0, 12);
  document.getElementById('homeListenAgain').replaceChildren(...again.map(createAlbumCard));

  // Sélection rapide : grille de titres en lignes (4 par colonne)
  const quick = (homeFilter === null ? dailyShuffle(pool) : pool).slice(0, 16);
  const quickQueue = quick.map(x => toQueueItem(x.artist, x.track));
  document.getElementById('homeQuickPicks').replaceChildren(...quick.map((x, i) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'quick-item';
    item.dataset.key = trackKey(quickQueue[i]);
    item.innerHTML = `
      <span class="quick-thumb"><img src="${x.track.cover}" alt="" loading="lazy"><span class="ms ms-fill">play_arrow</span></span>
      <span class="quick-text">
        <span class="quick-title">${escapeHtml(x.track.title)}</span>
        <span class="quick-sub">${escapeHtml(x.artist.name)}</span>
      </span>`;
    item.addEventListener('click', () => { window.playlist = quickQueue.slice(); loadAndPlay(i); });
    return item;
  }));
  document.getElementById('quickPlayAll').onclick = () => { window.playlist = quickQueue.slice(); loadAndPlay(0); };

  // Derniers sons : le dernier titre de chaque artiste
  const latest = (homeFilter === null ? artists : artists.filter(a => a.id === homeFilter))
    .filter(a => a.tracks.length)
    .flatMap(a => homeFilter === null ? [{ artist: a, track: a.tracks[a.tracks.length - 1] }] : a.tracks.slice().reverse().map(t => ({ artist: a, track: t })));
  document.getElementById('homeLatest').replaceChildren(...latest.map(createAlbumCard));

  updatePlayingState();
}

/* Flèches ‹ › des étagères : font défiler la rangée d'une « page » */
document.querySelectorAll('[data-scroll]').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = document.getElementById(btn.dataset.scroll);
    row.scrollBy({ left: Number(btn.dataset.dir) * row.clientWidth * 0.8, behavior: 'smooth' });
  });
});

/* Barre latérale : repliée en rail d'icônes ou dépliée (choix mémorisé) */
const sidebarToggle = document.getElementById('sidebarToggle');
try { if (localStorage.getItem('sidebar') === 'collapsed') document.body.classList.add('sidebar-collapsed'); } catch {}
sidebarToggle?.addEventListener('click', () => {
  const collapsed = document.body.classList.toggle('sidebar-collapsed');
  try { localStorage.setItem('sidebar', collapsed ? 'collapsed' : 'expanded'); } catch {}
});

function renderSearchHome() {
  const recentGrid = document.getElementById('listenAgainGrid');
  const artistsCircleGrid = document.getElementById('artistsCircleGrid');
  const mixedGrid = document.getElementById('mixedForYouGrid');

  // Le dernier titre de chaque artiste est le plus récent
  recentGrid.replaceChildren(...artists
    .filter(a => a.tracks.length > 0)
    .map(a => createAlbumCard({ artist: a, track: a.tracks[a.tracks.length - 1] })));

  artistsCircleGrid.replaceChildren(...artists.map(createArtistCircle));

  mixedGrid.replaceChildren(...featuredPicks
    .map(([artistName, title]) => findTrack(artistName, title))
    .filter(Boolean)
    .map(createAlbumCard));
}


/* ===== Playlists (user) ===== */
const LIKED = 'Sons Likés';
let openPlaylistName = null;

function savePlaylists(){ localStorage.setItem('playlists', JSON.stringify(window.userPlaylists)); }

/* ===== Likes (un titre ne peut être liké qu'une fois) ===== */
const trackKey = t => `${t.artist}::${t.title}`;

function getLiked(){
  if (!window.userPlaylists[LIKED]) window.userPlaylists[LIKED] = [];
  return window.userPlaylists[LIKED];
}

function isLiked(t){
  if (!t) return false;
  const key = trackKey(t);
  return (window.userPlaylists[LIKED] || []).some(s => trackKey(s) === key);
}

/* Ajoute ou retire un titre des Sons likés. Renvoie true si le titre est maintenant liké. */
function toggleLike(t){
  if (!t) return false;
  const liked = getLiked();
  const key = trackKey(t);
  const i = liked.findIndex(s => trackKey(s) === key);
  if (i >= 0) {
    liked.splice(i, 1);
    showToast('Retiré des Sons likés', { icon: 'heart_broken' });
  } else {
    liked.push({ title: t.title, artist: t.artist, src: t.src, thumb: t.thumb || '', canvasId: t.canvasId, video: t.video, duration: t.duration, addedAt: Date.now() });
    showToast('Ajouté aux Sons likés', { icon: 'favorite' });
  }
  window.likedSongs = liked;
  savePlaylists();
  renderPlaylists();
  refreshLikeButtons();
  return i < 0;
}

/* Met à jour tous les cœurs affichés (pages + lecteur) */
function refreshLikeButtons(){
  document.querySelectorAll('.track-row[data-key] .like-btn').forEach(btn => {
    const row = btn.closest('.track-row');
    const on = (window.userPlaylists[LIKED] || []).some(s => trackKey(s) === row.dataset.key);
    btn.classList.toggle('liked', on);
    btn.querySelector('.ms').classList.toggle('ms-fill', on);
  });
  window.updateLikeUI?.();
}

/* ===== Durées (mises en cache pour ne pas retélécharger à chaque visite) ===== */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

let durationCache = {};
try { durationCache = JSON.parse(localStorage.getItem('durations') || '{}'); } catch { durationCache = {}; }

function loadTrackDuration(audioSrc, callback) {
  if (durationCache[audioSrc]) return callback(durationCache[audioSrc]);

  const tempAudio = new Audio();
  tempAudio.preload = 'metadata';
  tempAudio.addEventListener('loadedmetadata', () => {
    durationCache[audioSrc] = tempAudio.duration;
    try { localStorage.setItem('durations', JSON.stringify(durationCache)); } catch {}
    callback(tempAudio.duration);
    tempAudio.removeAttribute('src');
  }, { once: true });
  tempAudio.addEventListener('error', () => callback(0), { once: true });
  tempAudio.src = audioSrc;
}

/* ===== Ligne de titre commune (artiste, playlists, sons likés) =====
   action : 'like' (cœur), 'unlike' (retirer des likés) ou 'remove' (retirer de la playlist) */
const ROW_ACTIONS = {
  like:   { cls: 'like-btn',   icon: '<span class="ms">favorite</span>',         title: 'Ajouter aux favoris' },
  unlike: { cls: 'unlike-btn', icon: '<span class="ms ms-fill">favorite</span>', title: 'Ne plus aimer' },
  remove: { cls: 'del-btn',    icon: '<span class="ms">delete</span>',           title: 'Retirer de la playlist' }
};

function createTrackRow(t, idx, { action, onPlay, onAction }) {
  const row = document.createElement('div');
  row.className = 'track-row';
  row.dataset.key = trackKey(t);

  const thumbHTML = t.thumb
    ? `<img src="${t.thumb}" class="track-cover-small" alt="" loading="lazy">`
    : `<div class="track-cover-small track-cover-fallback">♪</div>`;
  const act = ROW_ACTIONS[action];

  row.innerHTML = `
    <div class="track-col-number">
      <span class="track-number-text">${idx + 1}</span>
      <span class="ms ms-fill track-play-icon">play_arrow</span>
    </div>
    <div class="track-col-title">
      ${thumbHTML}
      <div class="track-title-info">
        <div class="track-title-text">${escapeHtml(t.title)}</div>
        <div class="track-artist-text">${escapeHtml(t.artist)}</div>
      </div>
    </div>
    <div class="track-col-album">${escapeHtml(t.artist)}</div>
    <div class="track-col-duration">
      <div class="track-actions">
        <button class="track-action-btn ${act.cls}" title="${act.title}" aria-label="${act.title}">
          ${act.icon}
        </button>
      </div>
      <span class="track-duration-text">${t.duration || '0:00'}</span>
    </div>
  `;

  if (t.src && !t.duration) {
    loadTrackDuration(resolveSrc(t.src), (duration) => {
      row.querySelector('.track-duration-text').textContent = formatDuration(duration);
    });
  }

  row.addEventListener('click', (e) => {
    if (e.target.closest('.track-action-btn')) return;
    onPlay();
  });
  row.querySelector('.track-action-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    onAction();
  });

  return row;
}

/* Lance une liste de titres à partir de l'index donné */
function playQueue(items, idx) {
  window.playlist = items.slice();
  loadAndPlay(idx);
  if (window.matchMedia('(max-width: 900px)').matches) window.openFullPlayer?.();
}

function renderSidebarPlaylists(){
  const box = document.getElementById('sidebarPlaylists');
  if (!box) return;
  const liked = (window.userPlaylists[LIKED] || []).length;
  const entries = [
    { name: 'Sons likés', sub: `Playlist auto • ${liked} titre${liked > 1 ? 's' : ''}`, href: '#/liked' },
    ...Object.keys(window.userPlaylists).filter(pl => pl !== LIKED).map(pl => ({
      name: pl, sub: `Playlist • ${window.userPlaylists[pl].length} titre${window.userPlaylists[pl].length > 1 ? 's' : ''}`, href: `#/playlist/${encodeURIComponent(pl)}`
    }))
  ];
  box.replaceChildren(...entries.map(e => {
    const a = document.createElement('a');
    a.className = 'sidebar-playlist';
    a.href = e.href;
    a.innerHTML = `<strong>${escapeHtml(e.name)}</strong><small>${escapeHtml(e.sub)}</small>`;
    return a;
  }));
}

/* ===== Bibliothèque : liste des playlists (Sons likés en premier) ===== */
function playlistCover(items, name) {
  const thumbs = items.map(t => t.thumb).filter(Boolean);
  if (thumbs.length >= 4) return `<span class="lib-cover lib-mosaic">${thumbs.slice(0, 4).map(s => `<img src="${s}" alt="" loading="lazy">`).join('')}</span>`;
  if (thumbs.length) return `<span class="lib-cover"><img src="${thumbs[0]}" alt="" loading="lazy"></span>`;
  return `<span class="lib-cover lib-letter">${escapeHtml(name.charAt(0).toUpperCase())}</span>`;
}

function renderPlaylists(){
  renderSidebarPlaylists();
  const list = playlistListDiv;
  const liked = window.userPlaylists[LIKED] || [];
  const names = Object.keys(window.userPlaylists).filter(pl => pl !== LIKED);
  const count = n => `${n} titre${n > 1 ? 's' : ''}`;

  list.innerHTML = `
    <a class="lib-row" href="#/liked">
      <span class="lib-cover lib-liked"><span class="ms ms-fill">favorite</span></span>
      <span class="lib-text"><strong>Sons likés</strong><small>Playlist automatique · ${count(liked.length)}</small></span>
      <span class="ms lib-chevron">chevron_right</span>
    </a>
    ${names.map(pl => `
    <a class="lib-row" href="#/playlist/${encodeURIComponent(pl)}">
      ${playlistCover(window.userPlaylists[pl], pl)}
      <span class="lib-text"><strong>${escapeHtml(pl)}</strong><small>Playlist · ${count(window.userPlaylists[pl].length)}</small></span>
      <span class="ms lib-chevron">chevron_right</span>
    </a>`).join('')}
    ${names.length ? '' : '<p class="empty-state">Crée ta première playlist avec le champ ci-dessus.</p>'}`;

  // Met à jour l'écran ouvert (Sons likés ou playlist)
  const [page, param] = location.hash.replace(/^#\/?/, '').split('/');
  if (page === 'liked') renderLikedTracks();
  if (page === 'playlist' && param) renderOpenPlaylist(decodeURIComponent(param));
}

/* Écran « Sons likés » */
function renderLikedTracks(){
  renderPlaylistScreen(document.getElementById('page-liked'), {
    name: 'Sons likés',
    items: window.userPlaylists[LIKED] || [],
    liked: true,
    backHref: '#/playlists',
    onRemove: (t) => toggleLike(t)
  });
}

/* Écran d'une playlist */
function renderOpenPlaylist(name){
  const el = document.getElementById('page-playlist');
  const items = window.userPlaylists[name];
  if (!items) {
    el.innerHTML = '<p class="empty-state" style="padding:24px 0">Cette playlist n’existe plus.</p>';
    return;
  }
  renderPlaylistScreen(el, {
    name,
    items,
    backHref: '#/playlists',
    onRemove: (t) => {
      const i = items.indexOf(t);
      if (i >= 0) items.splice(i, 1);
      savePlaylists();
      renderPlaylists();
      removedToast(name);
    },
    onDelete: () => {
      if (!confirm(`Supprimer la playlist "${name}" ?`)) return;
      delete window.userPlaylists[name];
      savePlaylists();
      renderPlaylists();
      showToast(`Playlist "${name}" supprimée`, { icon: 'delete' });
      navigate('/playlists');
    }
  });
}

/* ===== Artist Page ===== */
function goToArtist(a){
  navigate(`/artist/${a.id}`);
}

function appUrl(path){
  return `${location.origin}${location.pathname}#${path}`;
}

/* Glisser un titre vers la droite pour le liker (mobile) */
function addSwipeToLike(tr, t) {
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isSwiping = false;
  let swipeAdded = false;

  tr.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchCurrentX = touchStartX;
    isSwiping = true;
    swipeAdded = false;
    tr.style.transition = 'none';
  }, { passive: true });

  tr.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    touchCurrentX = e.touches[0].clientX;
    const deltaX = touchCurrentX - touchStartX;

    if (deltaX > 0) {
      tr.style.transform = `translateX(${deltaX}px)`;
      tr.style.opacity = Math.max(0.5, 1 - (deltaX / 300));

      if (deltaX > 100 && !swipeAdded) {
        swipeAdded = true;
        if (navigator.vibrate) navigator.vibrate(50);
        tr.style.backgroundColor = 'rgba(29, 185, 84, 0.3)';
      }
    }
  }, { passive: true });

  tr.addEventListener('touchend', () => {
    if (!isSwiping) return;
    isSwiping = false;

    const reset = () => {
      tr.style.transition = 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease';
      tr.style.transform = 'translateX(0)';
      tr.style.opacity = '1';
      tr.style.backgroundColor = '';
    };

    if (touchCurrentX - touchStartX > 100 && swipeAdded) {
      tr.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
      tr.style.transform = 'translateX(100%)';
      tr.style.opacity = '0';
      setTimeout(() => {
        reset();
        if (!isLiked(t)) toggleLike(t);
      }, 400);
    } else {
      reset();
    }
  });
}

function openArtist(a){
  window.currentArtistData = a;
  renderPage('artist');
  document.title = `${a.name} - Muzikly`;

  artistPageBanner.style.setProperty('--artist-bg', `url('${a.photo}')`);
  artistPageName.textContent = a.name;
  artistPageBio.textContent = trackCountLabel(a);
  renderArtistEventBadge(document.getElementById('artistEventBadge'), a);
  const avatar = document.getElementById('artistPageAvatar');
  avatar.src = a.photo;
  avatar.alt = a.name;

  artistTracksList.innerHTML = '';
  const items = a.tracks.map(t => toQueueItem(a, t));

  items.forEach((t, idx) => {
    const tr = createTrackRow(t, idx, {
      action: 'like',
      onPlay: () => playQueue(items, idx),
      onAction: () => toggleLike(t)
    });
    addSwipeToLike(tr, t);
    artistTracksList.appendChild(tr);
  });

  refreshLikeButtons();
  updatePlayingState();
}

if(artistPlayBtn) {
  artistPlayBtn.addEventListener('click', ()=>{
    const a = window.currentArtistData;
    if(a && a.tracks.length > 0){
      window.playlist = a.tracks.map(t => toQueueItem(a, t));
      loadAndPlay(0);
    }
  });
}

document.getElementById('artistShuffleBtn')?.addEventListener('click', () => {
  const a = window.currentArtistData;
  if (!a || a.tracks.length === 0) return;
  window.playlist = a.tracks.map(t => toQueueItem(a, t));
  window.isShuffle = true;
  window.updateFullPlayerUI?.();
  loadAndPlay(Math.floor(Math.random() * a.tracks.length));
  showToast('Lecture aléatoire activée', { icon: 'shuffle' });
});

document.getElementById('artistShareBtn')?.addEventListener('click', () => {
  const a = window.currentArtistData;
  if (!a) return;
  shareLink({ title: `${a.name} sur Muzikly`, text: `Écoute ${a.name} sur Muzikly`, url: appUrl(`/artist/${a.id}`) });
});

/* ===== Search ===== */
const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function setSearchMode(searching){
  document.getElementById('searchDefaultView').classList.toggle('hidden', searching);
  searchResultsDiv.classList.toggle('hidden', !searching);
}

function doSearch(q){
  // Recherche insensible aux accents : « genant » trouve « Génant »
  const query = normalize(q);
  const results = [];
  artists.forEach(a=>{
    a.tracks.forEach(t=>{
      if(normalize(t.title).includes(query) || normalize(a.name).includes(query)){
        results.push(toQueueItem(a, t));
      }
    });
  });

  setSearchMode(true);
  searchResultsDiv.innerHTML = '';
  if(results.length===0) {
    searchResultsDiv.innerHTML = `<p class="empty-state">Aucun résultat pour « ${escapeHtml(q)} »</p>`;
    return;
  }
  results.forEach((r, idx)=>{
    const card = document.createElement('div');
    card.className = 'track-card';
    card.innerHTML = `<div style="display:flex;gap:12px;align-items:center">
                        <img src="${r.thumb}" style="width:56px;height:56px;border-radius:8px;object-fit:cover;" alt="" loading="lazy">
                        <div><div class="title">${escapeHtml(r.title)}</div><div class="sub">${escapeHtml(r.artist)}</div></div></div>
                      <div><button class="play-btn" aria-label="Lire ${escapeHtml(r.title)}"><span class="ms ms-fill">play_arrow</span></button></div>`;
    // Toute la carte est cliquable, et la suite des résultats forme la file de lecture
    card.addEventListener('click', ()=> playQueue(results, idx));
    searchResultsDiv.appendChild(card);
  });
}

searchInput.addEventListener('input', (e)=>{
  const q = e.target.value.trim();
  history.replaceState(null, '', q ? '#/search/' + encodeURIComponent(q) : '#/search');
  if(q.length<2){ searchResultsDiv.innerHTML=''; setSearchMode(false); return; }
  doSearch(q);
});

/* ===== Player functions ===== */
function resolveSrc(src){
  if(Array.isArray(src)){
    // return first reachable — we assume first is local, second is fallback
    return src[0] || src[1];
  }
  return src;
}

/* ===== Lyrics Loading ===== */
const NO_LYRICS = '<p class="lyrics-placeholder">Les paroles ne sont pas encore disponibles pour ce titre.</p>';

/* Aperçu de la première ligne des paroles dans l'onglet « Paroles » du lecteur */
function setLyricsExcerpt(container) {
  const el = document.getElementById('lyricsExcerpt');
  if (!el) return;
  const first = container && [...container.querySelectorAll('p:not(.lyrics-placeholder)')].find(p => p.textContent.trim());
  el.textContent = first ? first.textContent.trim() : 'Pas encore de paroles pour ce titre';
  el.classList.toggle('has-lyrics', !!first);
}

async function loadLyrics(track) {
  const lyricsContentDiv = document.getElementById('lyricsContent');

  if (!lyricsContentDiv) return;

  lyricsContentDiv.innerHTML = '<p class="lyrics-placeholder">Chargement des paroles...</p>';
  setLyricsExcerpt(null);

  try {
    // On cherche d'abord chez l'artiste du titre (deux artistes peuvent avoir un titre identique)
    let artistIndex = artists.findIndex(a => a.name === track.artist && a.tracks.some(t => t.title === track.title));
    if (artistIndex === -1) artistIndex = artists.findIndex(a => a.tracks.some(t => t.title === track.title));

    if (artistIndex === -1) {
      lyricsContentDiv.innerHTML = NO_LYRICS;
      return;
    }

    const artist = artists[artistIndex];
    const trackIndex = artist.tracks.findIndex(t => t.title === track.title);
    const lyricsUrl = `${LYRICS_BASE_URL}/artiste${artistIndex + 1}/son${trackIndex + 1}.json`;

    const response = await fetch(lyricsUrl);

    if (!response.ok) {
      lyricsContentDiv.innerHTML = NO_LYRICS;
      return;
    }

    const lyricsData = await response.json();

    let lyricsHTML = '';

    if (lyricsData.lyrics && Array.isArray(lyricsData.lyrics)) {
      lyricsHTML = lyricsData.lyrics
        .map(line => line === '' ? '<br>' : `<p>${escapeHtml(line)}</p>`)
        .join('');
    } else if (lyricsData.sections && Array.isArray(lyricsData.sections)) {
      lyricsHTML = lyricsData.sections
        .map(section => {
          const sectionClass = section.type ? `lyrics-${escapeHtml(section.type)}` : '';
          return section.lines
            .map(line => `<p class="${sectionClass}">${escapeHtml(line)}</p>`)
            .join('');
        })
        .join('<br>');
    } else {
      lyricsContentDiv.innerHTML = '<p class="lyrics-placeholder">Format de paroles non reconnu.</p>';
      return;
    }

    lyricsContentDiv.innerHTML = lyricsHTML || NO_LYRICS;
    setLyricsExcerpt(lyricsContentDiv);

  } catch (error) {
    console.error('Erreur lors du chargement des paroles:', error);
    lyricsContentDiv.innerHTML = NO_LYRICS;
  }
}

function loadTrack(i){
  const t = window.playlist[i];
  if(!t) return;
  const src = resolveSrc(t.src);
  if(audio.src !== src) audio.src = src;

  if (typeof updateMiniPlayer === 'function') {
    updateMiniPlayer(t.title, t.artist, t.thumb);
  }

  if (typeof updateFullPlayerUI === 'function') {
    updateFullPlayerUI();
  }

  loadLyrics(t);
  saveLastPlayed();
}

function loadAndPlay(i){
  if(!window.playlist[i]) return;
  window.currentIndex = i;
  loadTrack(i);

  updatePlayingState();

  audio.play().catch(() => {});
}

/* Surligne le titre en cours dans toutes les listes (comparaison par artiste + titre) */
function updatePlayingState() {
  const current = window.playlist[window.currentIndex];
  const key = current ? trackKey(current) : null;
  document.querySelectorAll('.track-row, .quick-item, .pl-row').forEach(r => {
    r.classList.toggle('playing', key !== null && r.dataset.key === key);
  });
}

/* save last played */
function saveLastPlayed(){
  const t = window.playlist[window.currentIndex];
  if(!t) return;
  localStorage.setItem('lastPlayed', JSON.stringify({title:t.title, artist:t.artist, thumb:t.thumb}));
  // On garde les 20 derniers titres écoutés (sans doublon), du plus récent au plus ancien
  const history = getHistory().filter(h => !(h.title === t.title && h.artist === t.artist));
  history.unshift({ title: t.title, artist: t.artist });
  try { localStorage.setItem('history', JSON.stringify(history.slice(0, 20))); } catch {}
}

/* ===== Hero Banner Click ===== */
const heroArt = document.getElementById('heroArt');
function playHero() {
  playQueue([{
    title: 'Kill My Flesh',
    artist: 'Eilynn, Elihem',
    src: 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/sons/artiste5/son12.mp3',
    thumb: `${GITHUB_BASE_URL}/op/cv/artiste5/cover12.jpg`,
    canvasId: 'artiste5/12',
    video: 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste10/2.mp4'
  }], 0);
}
if (heroArt) {
  heroArt.addEventListener('click', playHero);
  heroArt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playHero(); }
  });
}

/* ===== Init render & events ===== */
function createPlaylist(){
  const name = newPlaylistNameInput.value.trim();
  if(!name) {
    showToast('Donne un nom à la playlist', { icon: 'error' });
    newPlaylistNameInput.focus();
    return;
  }
  if(name === LIKED || window.userPlaylists[name]) {
    showToast(`La playlist "${name}" existe déjà`, { icon: 'error' });
    return;
  }
  window.userPlaylists[name] = [];
  savePlaylists();
  navigate('/playlist/' + encodeURIComponent(name));
  renderPlaylists();
  newPlaylistNameInput.value = '';
  showToast(`Playlist "${name}" créée`, { icon: 'queue_music' });
}

async function init(){
  // Affiche la page demandée tout de suite, puis complète quand les vidéos sont chargées
  renderArtists();
  renderHome();
  renderSearchHome();
  renderUpcomingSection(document.getElementById('exploreEvents'));
  renderPlaylists();
  route();

  createPlaylistBtn?.addEventListener('click', createPlaylist);
  newPlaylistNameInput?.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') createPlaylist(); });

  headerSearch.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      const q = e.target.value.trim();
      if(q.length>=2) navigate('/search/' + encodeURIComponent(q));
    }
  });

  await Promise.all([loadVideosForArtists(), initUpcomingShorts()]);
}

/* Suivant : en mode aléatoire, on évite de rejouer le même titre */
function handleNext() {
  const n = window.playlist.length;
  if (n === 0) return;
  if (window.isShuffle && n > 1) {
    let next;
    do { next = Math.floor(Math.random() * n); } while (next === window.currentIndex);
    loadAndPlay(next);
    return;
  }
  loadAndPlay((window.currentIndex + 1) % n);
}

function handlePrev() {
  if (window.audio.currentTime > 3) {
    window.audio.currentTime = 0;
    return;
  }
  const n = window.playlist.length;
  if (n === 0) return;
  loadAndPlay((window.currentIndex - 1 + n) % n);
}

window.audio = audio;
window.SUPABASE_CANVAS_URL = SUPABASE_CANVAS_URL;
window.artists = artists;
window.savePlaylists = savePlaylists;
window.renderPlaylists = renderPlaylists;
window.loadAndPlay = loadAndPlay;
window.showPage = showPage;
window.updatePlayingState = updatePlayingState;
window.openArtist = goToArtist;
window.handleNext = handleNext;
window.handlePrev = handlePrev;
window.isLiked = isLiked;
window.toggleLike = toggleLike;
window.shareCurrentTrack = shareCurrentTrack;

/* Partage du titre en cours : lien direct vers #/track/<artiste>/<numéro> */
function shareCurrentTrack(){
  const t = window.playlist[window.currentIndex];
  if (!t) return;
  const artist = artists.find(a => a.name === t.artist);
  const idx = artist ? artist.tracks.findIndex(x => x.title === t.title) : -1;
  const url = idx >= 0 ? appUrl(`/track/${artist.id}/${idx + 1}`) : appUrl('/home');
  shareLink({ title: `${t.title} - ${t.artist}`, text: `Écoute « ${t.title} » de ${t.artist} sur Muzikly`, url });
}

/* kick off : après le chargement de tous les modules (player.js inclus) */
document.addEventListener('DOMContentLoaded', init);

/* ===== Menu latéral sur mobile =====
   Sur mobile, toucher le logo ouvre la barre latérale depuis la gauche
   (Vidéos, Wrapped 25, Verset du jour, Upload Music, playlists…). */
(function setupMobileDrawer() {
  const brand = document.querySelector('.appbar .brand');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('drawerBackdrop');
  if (!brand || !sidebar || !backdrop) return;
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  const open = () => {
    backdrop.hidden = false;
    requestAnimationFrame(() => document.body.classList.add('drawer-open'));
    brand.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    document.body.classList.remove('drawer-open');
    brand.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!document.body.classList.contains('drawer-open')) backdrop.hidden = true; }, 250);
  };

  brand.addEventListener('click', (e) => {
    if (!isMobile()) return;           // sur ordinateur, le logo ramène à l'accueil
    e.preventDefault();
    document.body.classList.contains('drawer-open') ? close() : open();
  });
  backdrop.addEventListener('click', close);
  sidebar.addEventListener('click', (e) => { if (e.target.closest('a, button[data-soon]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.addEventListener('hashchange', close);
})();

/* ========= Fusion JS (artistes + albums + lecteur + playlists + recherche) ========= */

import { initVideoManager, loadAllVideos } from './videoManager.js';
import { initUpcomingShorts, handleUpcomingPageOpen, closeUpcomingIfOpen } from './upcoming.js';
import { showToast, escapeHtml, shareLink } from './ui.js';

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

  if (id === 'upcoming') {
    handleUpcomingPageOpen();
  }
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

  if (page === 'search' && params[0]) {
    renderPage('search');
    searchInput.value = params[0];
    doSearch(params[0]);
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
  b.addEventListener('click', ()=> showToast(`${b.dataset.soon} arrive bientôt !`, { icon: 'fa-hourglass-half' }));
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
    return `<span class="artist-badge"><img src="${badgeUrl}" alt="${badgeFileName}" loading="lazy"></span>`;
  }).join('');

  return `<div class="artist-badges">${badgeElements}</div>`;
}

/* ===== Render artistes ===== */
function renderArtists(){
  artistsGrid.innerHTML='';
  artists.forEach(a=>{
    const card = document.createElement('div');
    card.className = 'artist-card';
    card.style.backgroundColor = a.bgColor;
    card.innerHTML = `
    <img src="${a.photo}" class="avatar" alt="${escapeHtml(a.name)}" loading="lazy">
    <div class="artist-info">
      <h3>${escapeHtml(a.name)}</h3>
      <p>${escapeHtml(a.bio)}</p>
    </div>
    ${getBadgesHTML(a.badges)}
    `;

    card.addEventListener('mouseenter', ()=> {
      card.style.backgroundColor = a.bgColorHover;
    });
    card.addEventListener('mouseleave', ()=> {
      card.style.backgroundColor = a.bgColor;
    });

    card.addEventListener('click', ()=> goToArtist(a));
    artistsGrid.appendChild(card);
  });
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
    <img src="${track.cover}" alt="${escapeHtml(track.title)}" loading="lazy">
    <div class="search-album-info">
      <div class="search-album-title">${escapeHtml(track.title)}</div>
      <div class="search-album-artist">${escapeHtml(artist.name)}</div>
    </div>
  `;
  card.addEventListener('click', () => {
    window.playlist = artist.tracks.map(t => toQueueItem(artist, t));
    loadAndPlay(artist.tracks.indexOf(track));
    window.openFullPlayer?.();
  });
  return card;
}

function renderSearchHome() {
  const recentGrid = document.getElementById('listenAgainGrid');
  const artistsCircleGrid = document.getElementById('artistsCircleGrid');
  const mixedGrid = document.getElementById('mixedForYouGrid');

  // Le dernier titre de chaque artiste est le plus récent
  recentGrid.replaceChildren(...artists
    .filter(a => a.tracks.length > 0)
    .map(a => createAlbumCard({ artist: a, track: a.tracks[a.tracks.length - 1] })));

  artistsCircleGrid.replaceChildren(...artists.map(a => {
    const card = document.createElement('div');
    card.className = 'search-artist-card';
    card.innerHTML = `
      <img src="${a.photo}" alt="${escapeHtml(a.name)}" loading="lazy">
      <div class="search-artist-name">${escapeHtml(a.name)}</div>
    `;
    card.addEventListener('click', () => goToArtist(a));
    return card;
  }));

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
    showToast('Retiré des Sons likés', { icon: 'fa-heart-crack' });
  } else {
    liked.push({ title: t.title, artist: t.artist, src: t.src, thumb: t.thumb || '', canvasId: t.canvasId, video: t.video, duration: t.duration });
    showToast('Ajouté aux Sons likés', { icon: 'fa-heart' });
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
    btn.querySelector('i').className = `${on ? 'fas' : 'far'} fa-heart`;
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
  like:   { cls: 'like-btn',   icon: 'far fa-heart', title: 'Ajouter aux favoris' },
  unlike: { cls: 'unlike-btn', icon: 'fas fa-heart', title: 'Ne plus aimer' },
  remove: { cls: 'del-btn',    icon: 'fas fa-trash', title: 'Retirer de la playlist' }
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
      <i class="fas fa-play track-play-icon"></i>
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
          <i class="${act.icon}"></i>
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
  window.openFullPlayer?.();
}

function renderPlaylists(){
  const list = playlistListDiv;
  list.innerHTML = '';

  const colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7', 'color-8', 'color-9', 'color-10'];
  const names = Object.keys(window.userPlaylists).filter(pl => pl !== LIKED);

  if (names.length === 0) {
    list.innerHTML = '<p class="empty-state">Crée ta première playlist avec le champ ci-dessus.</p>';
  }

  names.forEach((pl, i) => {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    const count = window.userPlaylists[pl].length;

    card.innerHTML = `
      <div class="playlist-cover ${colors[i % colors.length]}">
        ${escapeHtml(pl.charAt(0).toUpperCase())}
      </div>
      <div class="playlist-card-info">
        <strong>${escapeHtml(pl)}</strong>
        <small>${count} titre${count > 1 ? 's' : ''}</small>
      </div>
      <div style="display: flex; gap: 8px; margin-top: auto;">
        <button class="open">Ouvrir</button>
        <button class="del" aria-label="Supprimer la playlist">🗑</button>
      </div>
    `;

    card.querySelector('.open').addEventListener('click', () => renderPlaylistTracks(pl));
    card.querySelector('.del').addEventListener('click', () => {
      if (confirm(`Supprimer la playlist "${pl}" ?`)) {
        delete window.userPlaylists[pl];
        if (openPlaylistName === pl) openPlaylistName = null;
        savePlaylists();
        renderPlaylists();
        showToast(`Playlist "${pl}" supprimée`, { icon: 'fa-trash' });
      }
    });
    list.appendChild(card);
  });

  // Réaffiche la playlist ouverte, sinon les sons likés
  if (openPlaylistName && window.userPlaylists[openPlaylistName]) {
    renderPlaylistTracks(openPlaylistName);
  } else if ((window.userPlaylists[LIKED] || []).length > 0) {
    renderPlaylistTracks(LIKED);
  } else {
    playlistTracksDiv.innerHTML = '';
  }
  renderLikedTracks();
}

function renderPlaylistTracks(plName){
  openPlaylistName = plName === LIKED ? null : plName;
  const container = playlistTracksDiv;
  const headerHTML = plName === LIKED ? '' : `<h3 style="margin-bottom: 20px;">${escapeHtml(plName)}</h3>`;
  container.innerHTML = `${headerHTML}
    <div class="tracks-table-header">
      <div class="track-col-number">#</div>
      <div class="track-col-title">Titre</div>
      <div class="track-col-album">Artiste</div>
      <div class="track-col-duration"><i class="far fa-clock"></i></div>
    </div>`;

  const tableBody = document.createElement('div');
  tableBody.className = 'tracks-table-body';
  const items = window.userPlaylists[plName];

  if (items.length === 0) {
    tableBody.innerHTML = '<p class="empty-state">Cette playlist est vide. Ajoute des titres depuis le lecteur (menu ⋯).</p>';
  }

  items.forEach((t, idx) => {
    tableBody.appendChild(createTrackRow(t, idx, {
      action: plName === LIKED ? 'unlike' : 'remove',
      onPlay: () => playQueue(items, idx),
      onAction: () => {
        if (plName === LIKED) return toggleLike(t);
        items.splice(idx, 1);
        savePlaylists();
        renderPlaylists();
      }
    }));
  });

  container.appendChild(tableBody);
  updatePlayingState();
}

function renderLikedTracks(){
  const liked = window.userPlaylists[LIKED] || [];
  likedTracksDiv.innerHTML = '';
  if(liked.length === 0){
    likedTracksDiv.innerHTML = '<p class="empty-state">Aucun son liké pour l\'instant. Touche le cœur ♡ d\'un titre pour le retrouver ici.</p>';
    return;
  }

  liked.forEach((t, idx) => {
    likedTracksDiv.appendChild(createTrackRow(t, idx, {
      action: 'unlike',
      onPlay: () => playQueue(liked, idx),
      onAction: () => toggleLike(t)
    }));
  });
  updatePlayingState();
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
  artistPageBio.textContent = a.bio;

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
                      <div><button class="play-btn" aria-label="Lire ${escapeHtml(r.title)}"><i class="fas fa-play"></i></button></div>`;
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

async function loadLyrics(track) {
  const lyricsContentDiv = document.getElementById('lyricsContent');

  if (!lyricsContentDiv) return;

  lyricsContentDiv.innerHTML = '<p class="lyrics-placeholder">Chargement des paroles...</p>';

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
  document.querySelectorAll('.track-row').forEach(r => {
    r.classList.toggle('playing', key !== null && r.dataset.key === key);
  });
}

/* save last played */
function saveLastPlayed(){
  const t = window.playlist[window.currentIndex];
  if(!t) return;
  localStorage.setItem('lastPlayed', JSON.stringify({title:t.title, artist:t.artist, thumb:t.thumb}));
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
    showToast('Donne un nom à la playlist', { icon: 'fa-circle-exclamation' });
    newPlaylistNameInput.focus();
    return;
  }
  if(name === LIKED || window.userPlaylists[name]) {
    showToast(`La playlist "${name}" existe déjà`, { icon: 'fa-circle-exclamation' });
    return;
  }
  window.userPlaylists[name] = [];
  savePlaylists();
  renderPlaylistTracks(name);
  renderPlaylists();
  newPlaylistNameInput.value = '';
  showToast(`Playlist "${name}" créée`, { icon: 'fa-list' });
}

async function init(){
  // Affiche la page demandée tout de suite, puis complète quand les vidéos sont chargées
  renderArtists();
  renderSearchHome();
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

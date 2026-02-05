/* ========= Fusion JS (artistes + albums + lecteur + playlists + recherche) ========= */

import { initVideoManager, loadAllVideos } from './videoManager.js';
import { initUpcomingShorts, handleUpcomingPageOpen } from './upcoming.js';

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
  { name: 'NAN', bgColor: '#2a1a1a', bgColorHover: '#4a2a2a', badges: ['yt-artist-channel', 'won_a_competition'] },
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
  ['In God', 'Visé', 'Minimum', 'Can you hear me ?', 'Evidemment', 'The King ft Synaï', 'Chemin ft NAN', 'Kill My Flesh ft Eilynn'],
  ['Louange à Mon Dieu', 'Tentation', 'Dis moi ft Eilynn', 'Evangéliser', 'Je t aime ft Synaï', 'Cri du Coeur ft Synaï'],
  ['Cendrillon', 'Nouveau Départ', 'Victoire ft NAN', 'Ta Présence', 'A chaque jour', 'Je te retrouverai', 'Flame of Life', 'Papa Yahweh ft Synaï', 'Dis moi ft Sara', 'Muy Bonito ft Synaï', 'Sé ou épi mwen', 'Kill My Flesh ft Elihem'],
  ['Ma Carrière', 'Porter Du Fruit', 'Mourir à moi même', 'Mon Histoire', '10.10.2025'],
  ['Montres moi', 'Intro', 'Impro Prt1'],
  ['Math 1', 'Math 2', 'Math 3', 'Math 4', 'Math 5'],
  ['Zone à danger', 'Raph2'],
  ['A la Fontaine', 'Combat dans la Lumière']
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


/* === Albums list (visuels + quelques sources publiques du second code) === */
const albums = [
  { title:'Freestyle Pour Dieu', artist:'Synaï', image:'https://i.pinimg.com/236x/2c/23/17/2c2317fb606f8dad772f8b2a63dc1b07.jpg', audio:'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/sons/artiste%202/son2.mp3' },
  { title:'Obsédé', artist:'NAN(Rap-Gospel)', image:'https://i.pinimg.com/236x/2c/23/17/2c2317fb606f8dad772f8b2a63dc1b07.jpg', audio:'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/sons/artiste%201/son2.mp3' },
  { title:'In God', artist:'Elihem', image:'https://i.pinimg.com/236x/2c/23/17/2c2317fb606f8dad772f8b2a63dc1b07.jpg', audio:'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/sons/artiste%203/son1.mp3' },
  { title:'Sara 1', artist:'Sara', image:'https://i.pinimg.com/236x/2c/23/17/2c2317fb606f8dad772f8b2a63dc1b07.jpg', audio:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { title:'Cendrillon', artist:'Kalynn', image:'https://github.com/CX-Banger/profile-page-artiste/blob/main/assets/disque.jpg?raw=true', audio:'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/sons/artiste%205/son1.mp3' },
  { title:'Melohim (Remix)', artist:'Melohim', image:'https://github.com/CX-Banger/profile-page-artiste/blob/main/assets/disque.jpg?raw=true', audio:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { title:'Tiim 1', artist:'Tiim', image:'https://github.com/CX-Banger/profile-page-artiste/blob/main/assets/disque.jpg?raw=true', audio:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { title:'Math 1', artist:'Math', image:'https://github.com/CX-Banger/profile-page-artiste/blob/main/assets/disque.jpg?raw=true', audio:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
];

/* === DOM refs === */
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.nav-btn');
const bottomBtns = document.querySelectorAll('.bottom-nav .bt');
const artistsGrid = document.getElementById('artistsGrid');
const featuredDiv = document.getElementById('featured');
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

/* ===== Navigation ===== */
function showPage(id){
  if (id === 'upcoming') {
    handleUpcomingPageOpen();
    navBtns.forEach(b=>b.classList.toggle('active', b.dataset.page === `page-${id}` || b.dataset.page===id));
    bottomBtns.forEach(b=>b.classList.toggle('active', b.dataset.page === id));
    return;
  }

  pages.forEach(p=>p.classList.remove('active'));
  const targetPage = document.getElementById('page-' + id);
  if(targetPage) targetPage.classList.add('active');
  navBtns.forEach(b=>b.classList.toggle('active', b.dataset.page === `page-${id}` || b.dataset.page===id));
  bottomBtns.forEach(b=>b.classList.toggle('active', b.dataset.page === id));

  if (id === 'videos') {
    initVideoManager(artists);
  }
}
navBtns.forEach(b=>{
  b.addEventListener('click', ()=>{
    const page = b.dataset.page.replace('page-','');
    // pages are: home, playlists, liked, search, upcoming
    if(page==='page-home') showPage('home'); else showPage(b.dataset.page.replace('page-',''));
  });
});
bottomBtns.forEach(b=>{
  b.addEventListener('click', ()=> showPage(b.dataset.page));
});

/* support header search trigger */
headerSearch.addEventListener('input', e=>{
  const q = e.target.value.trim();
  if(q.length>=2){
    showPage('search');
    document.getElementById('searchInput').value = q;
    doSearch(q);
  }
});

/* ===== Badge URLs ===== */
const BADGE_BASE_URL = 'https://raw.githubusercontent.com/CX-Banger/unordered_set/9dbac3ece6711aeb7e41c402c1748b35b92a471f/icons-badges';

function getBadgesHTML(badges) {
  if (!badges || badges.length === 0) return '';

  const badgeElements = badges.map(badgeFileName => {
    const badgeUrl = `${BADGE_BASE_URL}/${badgeFileName}.svg`;
    return `<span class="artist-badge"><img src="${badgeUrl}" alt="${badgeFileName}"></span>`;
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
    <img src="${a.photo}" class="avatar" alt="${a.name}">
    <div class="artist-info">
      <h3>${a.name}</h3>
      <p>${a.bio}</p>
    </div>
    ${getBadgesHTML(a.badges)}
    `;

    card.addEventListener('mouseenter', ()=> {
      card.style.backgroundColor = a.bgColorHover;
    });
    card.addEventListener('mouseleave', ()=> {
      card.style.backgroundColor = a.bgColor;
    });

    card.addEventListener('click', ()=> openArtist(a));
    artistsGrid.appendChild(card);
  });
}

function renderFeatured(){
  if (!featuredDiv) return;
  featuredDiv.innerHTML='';

  const featuredAlbums = [
    { title: "Kill My Flesh", artist: "Eilynn", cover: `${GITHUB_BASE_URL}/op/cv/artiste5/cover12.jpg`, artistIndex: 4, trackIndex: 11 },
    { title: "Intro", artist: "Tiim", cover: `${GITHUB_BASE_URL}/op/cv/artiste7/cover2.jpg`, artistIndex: 6, trackIndex: 1 },
    { title: "Zone à danger", artist: "Raph", cover: `${GITHUB_BASE_URL}/op/cv/artiste9/cover1.jpg`, artistIndex: 8, trackIndex: 0 },
    { title: "Muy Bonito ft Eilynn", artist: "Synaï", cover: `${GITHUB_BASE_URL}/op/cv/artiste2/cover14.jpg`, artistIndex: 1, trackIndex: 13 },
    { title: "Kill My Flesh", artist: "Elihem", cover: `${GITHUB_BASE_URL}/op/cv/artiste3/cover8.jpg`, artistIndex: 2, trackIndex: 7 },
    { title: "Je t aime ft Synaï", artist: "Sara", cover: `${GITHUB_BASE_URL}/op/cv/artiste4/cover5.jpg`, artistIndex: 3, trackIndex: 4 },
    { title: "Sans Effet", artist: "NAN", cover: `${GITHUB_BASE_URL}/op/cv/artiste1/cover21.jpg`, artistIndex: 0, trackIndex: 20 },
    { title: "Ma Carrière", artist: "Melohim", cover: `${GITHUB_BASE_URL}/op/cv/artiste6/cover1.jpg`, artistIndex: 5, trackIndex: 0 }
  ];

  featuredAlbums.forEach(album => {
    const card = document.createElement("div");
    card.className = "featured-album";
    card.innerHTML = `
      <img src="${album.cover}" class="featured-album-cover" alt="${album.title}">
      <div class="featured-album-title">${album.title}</div>
      <div class="featured-album-year">${album.artist}</div>
    `;

    card.addEventListener("click", () => {
      const artist = artists[album.artistIndex];
      if (artist && artist.tracks && artist.tracks[album.trackIndex]) {
        const track = artist.tracks[album.trackIndex];
        window.playlist = [{
          src: track.src,
          title: track.title,
          artist: artist.name,
          thumb: track.cover || artist.photo,
          canvasId: track.canvasId,
          video: track.video
        }];
        window.currentIndex = 0;
        loadAndPlay(window.currentIndex);
      } else {
        console.warn("Track not found for:", album);
      }
    });

    featuredDiv.appendChild(card);
  });
}



/* ===== Upcoming ===== */
function renderUpcoming(){
  upcomingDiv.innerHTML = `
    <div class="featured-album">
      <img src="https://github.com/CX-Banger/cx-muzik/blob/main/libs/avenir.jpg?raw=true" class="featured-album-cover" alt="avenir">
      <div class="featured-album-title">Musique</div>
      <div class="featured-album-year">Artiste - bientot</div>
    </div>
  `;
} /* mettre le nom de l'album : <div class="title">nom_album </div> :)

/* ===== Playlists (user) ===== */
function savePlaylists(){ localStorage.setItem('playlists', JSON.stringify(window.userPlaylists)); }
function renderPlaylists(){
  const list = playlistListDiv;
  list.innerHTML = '';

  const likedExists = window.userPlaylists['Sons Likés'] && window.userPlaylists['Sons Likés'].length > 0;
  if(likedExists){
    renderPlaylistTracks('Sons Likés');
  }

  const colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7', 'color-8', 'color-9', 'color-10'];
  let colorIndex = 0;

  Object.keys(window.userPlaylists).forEach(pl=>{
    if(pl === 'Sons Likés') return;
    const card = document.createElement('div');
    card.className = 'playlist-card';
    const colorClass = colors[colorIndex % colors.length];
    colorIndex++;
    const firstLetter = pl.charAt(0).toUpperCase();

    card.innerHTML = `
      <div class="playlist-cover ${colorClass}">
        ${firstLetter}
      </div>
      <div class="playlist-card-info">
        <strong>${pl}</strong>
        <small>${window.userPlaylists[pl].length} titres</small>
      </div>
      <div style="display: flex; gap: 8px; margin-top: auto;">
        <button class="open">Ouvrir</button>
        <button class="del">🗑</button>
      </div>
    `;

    card.querySelector('.open').addEventListener('click', ()=>{
      renderPlaylistTracks(pl);
    });
    const delBtn = card.querySelector('.del');
    if(delBtn){
      delBtn.addEventListener('click', ()=>{
        if(confirm(`Supprimer la playlist "${pl}" ?`)){
          delete window.userPlaylists[pl];
          savePlaylists();
          renderPlaylists();
          playlistTracksDiv.innerHTML = '';
        }
      });
    }
    list.appendChild(card);
  });
  renderLikedTracks();
}

function renderPlaylistTracks(plName){
  const container = playlistTracksDiv;
  const headerHTML = plName === 'Sons Likés' ? '' : `<h3 style="margin-bottom: 20px;">${plName}</h3>`;
  container.innerHTML = `${headerHTML}
    <div class="tracks-table-header">
      <div class="track-col-number">#</div>
      <div class="track-col-title">Titre</div>
      <div class="track-col-album">Artiste</div>
      <div class="track-col-duration"><i class="far fa-clock"></i></div>
    </div>`;

  const tableBody = document.createElement('div');
  tableBody.className = 'tracks-table-body';

  window.userPlaylists[plName].forEach((t, idx)=>{
    const row = document.createElement('div');
    row.className = 'track-row';

    const thumbHTML = t.thumb && (t.thumb.startsWith('http') || t.thumb.includes('.jpg') || t.thumb.includes('.png'))
      ? `<img src="${t.thumb}" class="track-cover-small" alt="${t.title}">`
      : `<div class="track-cover-small" style="background:linear-gradient(135deg,#1DB954,#1ed760);display:flex;align-items:center;justify-content:center;color:white;border-radius:4px;">♪</div>`;

    const durationSpan = document.createElement('span');
    durationSpan.textContent = t.duration || '0:00';
    durationSpan.className = 'track-duration-text';

    row.innerHTML = `
      <div class="track-col-number">
        <span class="track-number-text">${idx + 1}</span>
        <i class="fas fa-play track-play-icon"></i>
      </div>
      <div class="track-col-title">
        ${thumbHTML}
        <div class="track-title-info">
          <div class="track-title-text">${t.title}</div>
          <div class="track-artist-text">${t.artist}</div>
        </div>
      </div>
      <div class="track-col-album">${t.artist}</div>
      <div class="track-col-duration">
        <div class="track-actions">
          <button class="track-action-btn del-btn" title="Supprimer">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;

    row.querySelector('.track-col-duration').appendChild(durationSpan);

    if (t.src && !t.duration) {
      loadTrackDuration(resolveSrc(t.src), (duration) => {
        const formattedDuration = formatTime(duration);
        durationSpan.textContent = formattedDuration;
        t.duration = formattedDuration;
        savePlaylists();
      });
    }

    row.addEventListener('click', (e)=>{
      if(e.target.closest('.track-action-btn')) return;
      window.playlist = window.userPlaylists[plName];
      window.currentIndex = idx;
      loadAndPlay(window.currentIndex);

      document.querySelectorAll('.track-row').forEach(r => r.classList.remove('playing'));
      row.classList.add('playing');

      if (typeof openFullPlayer === 'function') {
        openFullPlayer();
      }
    });

    row.querySelector('.del-btn').addEventListener('click', (e)=>{
      e.stopPropagation();
      window.userPlaylists[plName].splice(idx,1);
      savePlaylists();
      renderPlaylists();
      renderPlaylistTracks(plName);
    });

    tableBody.appendChild(row);
  });

  container.appendChild(tableBody);
}

function renderLikedTracks(){
  const liked = window.userPlaylists['Sons Likés'] || [];
  likedTracksDiv.innerHTML = '';
  if(liked.length === 0){
    likedTracksDiv.innerHTML = '<p style="color:var(--muted); padding: 20px;">Aucun son like pour l\'instant.</p>';
    return;
  }

  liked.forEach((t, idx)=>{
    const row = document.createElement('div');
    row.className = 'track-row';

    const thumbHTML = t.thumb && (t.thumb.startsWith('http') || t.thumb.includes('.jpg') || t.thumb.includes('.png'))
      ? `<img src="${t.thumb}" class="track-cover-small" alt="${t.title}">`
      : `<div class="track-cover-small" style="background:linear-gradient(135deg,#1DB954,#1ed760);display:flex;align-items:center;justify-content:center;color:white;border-radius:4px;">♪</div>`;

    const durationSpan = document.createElement('span');
    durationSpan.textContent = t.duration || '0:00';
    durationSpan.className = 'track-duration-text';

    row.innerHTML = `
      <div class="track-col-number">
        <span class="track-number-text">${idx + 1}</span>
        <i class="fas fa-play track-play-icon"></i>
      </div>
      <div class="track-col-title">
        ${thumbHTML}
        <div class="track-title-info">
          <div class="track-title-text">${t.title}</div>
          <div class="track-artist-text">${t.artist}</div>
        </div>
      </div>
      <div class="track-col-album">${t.artist}</div>
      <div class="track-col-duration">
        <div class="track-actions">
          <button class="track-action-btn unlike-btn" title="Ne plus aimer">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
    `;

    row.querySelector('.track-col-duration').appendChild(durationSpan);

    if (t.src && !t.duration) {
      loadTrackDuration(resolveSrc(t.src), (duration) => {
        const formattedDuration = formatTime(duration);
        durationSpan.textContent = formattedDuration;
        t.duration = formattedDuration;
        savePlaylists();
      });
    }

    row.addEventListener('click', (e)=>{
      if(e.target.closest('.track-action-btn')) return;
      window.playlist = window.userPlaylists['Sons Likés'];
      window.currentIndex = idx;
      loadAndPlay(window.currentIndex);

      document.querySelectorAll('.track-row').forEach(r => r.classList.remove('playing'));
      row.classList.add('playing');

      if (typeof openFullPlayer === 'function') {
        openFullPlayer();
      }
    });

    row.querySelector('.unlike-btn').addEventListener('click', (e)=>{
      e.stopPropagation();
      window.userPlaylists['Sons Likés'].splice(idx,1);
      window.likedSongs = window.userPlaylists['Sons Likés'];
      savePlaylists();
      renderLikedTracks();
    });

    likedTracksDiv.appendChild(row);
  });
}

/* ===== Artist Page ===== */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function loadTrackDuration(audioSrc, callback) {
  const tempAudio = new Audio();
  tempAudio.addEventListener('loadedmetadata', () => {
    callback(tempAudio.duration);
  });
  tempAudio.addEventListener('error', () => {
    callback(0);
  });
  tempAudio.src = audioSrc;
}

function openArtist(a){
  window.currentArtistData = a;
  showPage('artist');

  artistPageBanner.style.setProperty('--artist-bg', `url('${a.photo}')`);
  artistPageName.textContent = a.name;
  artistPageBio.textContent = a.bio;

  artistTracksList.innerHTML = '';

  a.tracks.forEach((t, idx)=>{
    const tr = document.createElement('div');
    tr.className = 'track-row';

    const durationSpan = document.createElement('span');
    durationSpan.textContent = '0:00';
    durationSpan.className = 'track-duration-text';

    tr.innerHTML = `
      <div class="track-col-number">
        <span class="track-number-text">${idx + 1}</span>
        <i class="fas fa-play track-play-icon"></i>
      </div>
      <div class="track-col-title">
        <img src="${t.cover}" class="track-cover-small" alt="${t.title}">
        <div class="track-title-info">
          <div class="track-title-text">${t.title}</div>
          <div class="track-artist-text">${a.name}</div>
        </div>
      </div>
      <div class="track-col-album">${a.name}</div>
      <div class="track-col-duration">
        <div class="track-actions">
          <button class="track-action-btn like-btn" title="Ajouter aux favoris">
            <i class="far fa-heart"></i>
          </button>
        </div>
      </div>
    `;

    const durationCol = tr.querySelector('.track-col-duration');
    durationCol.appendChild(durationSpan);

    const audioSrc = Array.isArray(t.src) ? t.src[0] : t.src;
    loadTrackDuration(audioSrc, (duration) => {
      durationSpan.textContent = formatDuration(duration);
    });

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
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
          tr.style.backgroundColor = 'rgba(29, 185, 84, 0.3)';
        }
      }
    }, { passive: true });

    tr.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      isSwiping = false;

      const deltaX = touchCurrentX - touchStartX;

      if (deltaX > 100 && swipeAdded) {
        if(!userPlaylists['Sons Likés']) userPlaylists['Sons Likés'] = [];
        userPlaylists['Sons Likés'].push({title:t.title,artist:a.name,src:Array.isArray(t.src)?t.src[0]:t.src,thumb:t.cover || a.photo});
        savePlaylists(); renderPlaylists();

        tr.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        tr.style.transform = 'translateX(100%)';
        tr.style.opacity = '0';

        setTimeout(() => {
          tr.style.transition = 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease';
          tr.style.transform = 'translateX(0)';
          tr.style.opacity = '1';
          tr.style.backgroundColor = '';

          const heartIcon = tr.querySelector('.like-btn i');
          if (heartIcon) {
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
            tr.querySelector('.like-btn').classList.add('liked');
          }
        }, 400);
      } else {
        tr.style.transition = 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease';
        tr.style.transform = 'translateX(0)';
        tr.style.opacity = '1';
        tr.style.backgroundColor = '';
      }
    });

    tr.addEventListener('click', (e)=>{
      if(e.target.closest('.track-action-btn')) return;
      const src = Array.isArray(t.src) ? t.src[0] : t.src;
      window.playlist = a.tracks.map(x=>({src: Array.isArray(x.src)? x.src[0] : x.src, title: x.title, artist: a.name, thumb: x.cover || a.photo, canvasId: x.canvasId, video: x.video}));
      window.currentIndex = idx;
      loadAndPlay(window.currentIndex);

      document.querySelectorAll('.track-row').forEach(r => r.classList.remove('playing'));
      tr.classList.add('playing');

      if (typeof openFullPlayer === 'function') {
        openFullPlayer();
      }
    });

    tr.querySelector('.like-btn').addEventListener('click', (e)=>{
      e.stopPropagation();
      if(!window.userPlaylists['Sons Likés']) window.userPlaylists['Sons Likés'] = [];
      window.userPlaylists['Sons Likés'].push({title:t.title,artist:a.name,src:Array.isArray(t.src)?t.src[0]:t.src,thumb:t.cover || a.photo,canvasId:t.canvasId,video:t.video});
      savePlaylists(); renderPlaylists();

      const heartIcon = tr.querySelector('.like-btn i');
      heartIcon.classList.remove('far');
      heartIcon.classList.add('fas');
      tr.querySelector('.like-btn').classList.add('liked');
    });

    artistTracksList.appendChild(tr);
  });
}

if(artistPlayBtn) {
  artistPlayBtn.addEventListener('click', ()=>{
    if(window.currentArtistData && window.currentArtistData.tracks.length > 0){
      const firstTrack = window.currentArtistData.tracks[0];
      window.playlist = window.currentArtistData.tracks.map(x=>({src: Array.isArray(x.src)? x.src[0] : x.src, title: x.title, artist: window.currentArtistData.name, thumb: x.cover || window.currentArtistData.photo, canvasId: x.canvasId, video: x.video}));
      window.currentIndex = 0;
      loadAndPlay(window.currentIndex);
    }
  });
}

/* ===== Search ===== */
function doSearch(q){
  const query = q.toLowerCase();
  const results = [];
  artists.forEach(a=>{
    a.tracks.forEach(t=>{
      if(t.title.toLowerCase().includes(query) || a.name.toLowerCase().includes(query)){
        results.push({
  title:t.title,
  artist:a.name,
  src: Array.isArray(t.src)? t.src[0]:t.src,
  thumb: t.cover || a.photo,
  canvasId: t.canvasId,
  video: t.video
});

      }
    });
  });
  // include albums
  albums.forEach(al=>{
    if(al.title.toLowerCase().includes(query) || al.artist.toLowerCase().includes(query)){
      results.push({title:al.title, artist:al.artist, src: al.audio, thumb: al.image, canvasId: null, video: null});
    }
  });

  // render
  searchResultsDiv.innerHTML = '';
  if(results.length===0) { searchResultsDiv.innerHTML = '<p style="color:var(--muted)">Aucun résultat</p>'; return; }
  results.forEach(r=>{
    const card = document.createElement('div');
    card.className = 'track-card';

    const thumbElement = r.thumb && (r.thumb.startsWith('http') || r.thumb.includes('.jpg') || r.thumb.includes('.png'))
      ? `<img src="${r.thumb}" style="width:56px;height:56px;border-radius:8px;object-fit:cover;" alt="${r.title}">`
      : `<div style="width:56px;height:56px;border-radius:8px;background:linear-gradient(135deg,#1DB954,#1ed760);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold">♪</div>`;

    card.innerHTML = `<div style="display:flex;gap:12px;align-items:center">${thumbElement}
                      <div><div class="title">${r.title}</div><div class="sub">${r.artist}</div></div></div>
                      <div><button class="play-btn"><i class="fas fa-play"></i></button></div>`;
    card.querySelector('.play-btn').addEventListener('click', ()=>{
      window.playlist = [{src:r.src,title:r.title,artist:r.artist,thumb:r.thumb,canvasId:r.canvasId,video:r.video}];
      window.currentIndex = 0;
      loadAndPlay(window.currentIndex);
      if (typeof openFullPlayer === 'function') {
        openFullPlayer();
      }
    });
    searchResultsDiv.appendChild(card);
  });
}

document.getElementById('searchInput').addEventListener('input', (e)=>{
  const q = e.target.value.trim();
  if(q.length<2){ searchResultsDiv.innerHTML=''; return; }
  doSearch(q);
});

/* header search already wired above */

/* ===== Player functions ===== */
function resolveSrc(src){
  if(Array.isArray(src)){
    // return first reachable — we assume first is local, second is fallback
    return src[0] || src[1];
  }
  return src;
}

/* ===== Lyrics Loading ===== */
async function loadLyrics(track) {
  const lyricsContentDiv = document.getElementById('lyricsContent');

  if (!lyricsContentDiv) return;

  lyricsContentDiv.innerHTML = '<p class="lyrics-placeholder">Chargement des paroles...</p>';

  try {
    const artistIndex = artists.findIndex(a =>
      a.tracks.some(t => t.title === track.title)
    );

    if (artistIndex === -1) {
      lyricsContentDiv.innerHTML = '<p class="lyrics-placeholder">Les paroles ne sont pas encore disponibles pour ce titre.</p>';
      return;
    }

    const artist = artists[artistIndex];
    const trackIndex = artist.tracks.findIndex(t => t.title === track.title);

    if (trackIndex === -1) {
      lyricsContentDiv.innerHTML = '<p class="lyrics-placeholder">Les paroles ne sont pas encore disponibles pour ce titre.</p>';
      return;
    }

    const lyricsUrl = `${LYRICS_BASE_URL}/artiste${artistIndex + 1}/son${trackIndex + 1}.json`;

    const response = await fetch(lyricsUrl);

    if (!response.ok) {
      lyricsContentDiv.innerHTML = '<p class="lyrics-placeholder">Les paroles ne sont pas encore disponibles pour ce titre.</p>';
      return;
    }

    const lyricsData = await response.json();

    let lyricsHTML = '';

    if (lyricsData.lyrics && Array.isArray(lyricsData.lyrics)) {
      lyricsHTML = lyricsData.lyrics
        .map(line => line === '' ? '<br>' : `<p>${line}</p>`)
        .join('');
    } else if (lyricsData.sections && Array.isArray(lyricsData.sections)) {
      lyricsHTML = lyricsData.sections
        .map(section => {
          const sectionClass = section.type ? `lyrics-${section.type}` : '';
          const lines = section.lines
            .map(line => `<p class="${sectionClass}">${line}</p>`)
            .join('');
          return lines;
        })
        .join('<br>');
    } else {
      lyricsContentDiv.innerHTML = '<p class="lyrics-placeholder">Format de paroles non reconnu.</p>';
      return;
    }

    lyricsContentDiv.innerHTML = lyricsHTML || '<p class="lyrics-placeholder">Les paroles ne sont pas encore disponibles pour ce titre.</p>';

  } catch (error) {
    console.error('Erreur lors du chargement des paroles:', error);
    lyricsContentDiv.innerHTML = '<p class="lyrics-placeholder">Les paroles ne sont pas encore disponibles pour ce titre.</p>';
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

  try{
    audio.play().catch(() => {});
  }catch(e){}
}

function updatePlayingState() {
  document.querySelectorAll('.track-row').forEach(r => r.classList.remove('playing'));

  const allRows = document.querySelectorAll('.track-row');
  allRows.forEach((row, idx) => {
    const trackNumber = row.querySelector('.track-number-text');
    if (trackNumber && parseInt(trackNumber.textContent) === window.currentIndex + 1) {
      row.classList.add('playing');
    }
  });
}

/* save/restore last played */
function saveLastPlayed(){
  const t = window.playlist[window.currentIndex];
  if(!t) return;
  localStorage.setItem('lastPlayed', JSON.stringify({title:t.title, artist:t.artist, thumb:t.thumb}));
}

function restoreLastPlayed(){
  const st = JSON.parse(localStorage.getItem('lastPlayed') || 'null');
  if(!st) return;
}

/* ===== Hero Banner Click ===== */
const heroArt = document.getElementById('heroArt');
if (heroArt) {
  heroArt.addEventListener('click', () => {
    const obsedeSong = {
      title: 'Kill My Flesh',
      artist: 'Eilynn, Elihem',
      src: 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/sons/artiste5/son12.mp3',
      thumb: `${GITHUB_BASE_URL}/op/cv/artiste5/cover12.jpg`,
      canvasId: 'artiste5/12',
      video: 'https://hrzmagjjobctkfxayokt.supabase.co/storage/v1/object/public/canvas/artiste10/2.mp4'
    };
    window.playlist = [obsedeSong];
    window.currentIndex = 0;
    loadAndPlay(0);
    if (typeof openFullPlayer === 'function') {
      openFullPlayer();
    }
  });
}

/* ===== Voir Plus Button ===== */
const voirPlusBtn = document.getElementById('voirPlusBtn');
if (voirPlusBtn) {
  voirPlusBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const featuredGrid = document.getElementById('featured');
    if (featuredGrid.classList.contains('expanded')) {
      featuredGrid.classList.remove('expanded');
      voirPlusBtn.textContent = 'Voir plus';
    } else {
      featuredGrid.classList.add('expanded');
      voirPlusBtn.textContent = 'Voir moins';
    }
  });
}

/* ===== Init render & events ===== */
async function init(){
  await loadVideosForArtists();
  renderArtists();
  renderFeatured();
  await initUpcomingShorts();
  renderPlaylists();
  restoreLastPlayed();

  // album grid from second project -> also available inside featuredDiv
  // Create starter playlist (first album)
  if(albums.length>0 && window.playlist.length===0){
    // don't auto play, just set as candidate
    window.playlist = albums.map(a=>({src:a.audio,title:a.title,artist:a.artist,thumb:a.image}));
  }

  // create playlist button
  if(createPlaylistBtn){
    createPlaylistBtn.addEventListener('click', ()=>{
      const name = newPlaylistNameInput.value.trim();
      if(!name) return alert('Donne un nom à la playlist');
      if(!window.userPlaylists[name]) window.userPlaylists[name] = [];
      savePlaylists(); renderPlaylists();
      newPlaylistNameInput.value = '';
    });
  }

  // header search enter wired to page search
  document.getElementById('headerSearch').addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      const q = e.target.value.trim();
      if(q.length>=2){ showPage('search'); document.getElementById('searchInput').value = q; doSearch(q); }
    }
  });

  // bottom nav (mobile)
  document.querySelectorAll('.bottom-nav .bt').forEach(b=>{
    b.addEventListener('click', ()=> showPage(b.dataset.page));
  });

  // small nav buttons (sidebar) map to pages
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      const pageMap = { 'Découvrir':'home' };
    });
  });
}

/* kick off */
init();

/* Make sure the UI reacts when clicking featured album play icons (delegation) */
document.addEventListener('click', (e)=>{
  if(e.target.closest('.album-item .play-button') || e.target.closest('.album-item')) {
    // handled by album item listeners already
  }
});

function handleNext() {
  if (window.isShuffle) {
    window.currentIndex = Math.floor(Math.random() * window.playlist.length);
    loadAndPlay(window.currentIndex);
    return;
  }
  if (window.currentIndex < window.playlist.length - 1) {
    window.currentIndex++;
  } else {
    window.currentIndex = 0;
  }
  loadAndPlay(window.currentIndex);
}

function handlePrev() {
  if (window.audio.currentTime > 3) {
    window.audio.currentTime = 0;
    return;
  }
  if (window.currentIndex > 0) {
    window.currentIndex--;
  } else {
    window.currentIndex = window.playlist.length - 1;
  }
  loadAndPlay(window.currentIndex);
}

window.audio = audio;
window.SUPABASE_CANVAS_URL = SUPABASE_CANVAS_URL;
window.artists = artists;
window.savePlaylists = savePlaylists;
window.renderPlaylists = renderPlaylists;
window.loadAndPlay = loadAndPlay;
window.showPage = showPage;
window.updatePlayingState = updatePlayingState;
window.openArtist = openArtist;
window.handleNext = handleNext;
window.handlePrev = handlePrev;

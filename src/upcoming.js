import { supabase } from './supabaseClient.js';

let currentShortIndex = 0;
let upcomingReleases = [];
let isVideoMuted = false;
let wasPlayingBeforeShorts = false;
let lastPlayedTrack = null;
let isInShortsMode = false;

export async function initUpcomingShorts() {
  const { data, error } = await supabase
    .from('upcoming_releases')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error loading upcoming releases:', error);
    return;
  }

  upcomingReleases = data || [];
}

export function handleUpcomingPageOpen() {
  if (upcomingReleases.length === 0) {
    const upcomingContainer = document.getElementById('upcoming');
    if (upcomingContainer) {
      upcomingContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-music" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
          <p>Aucune sortie à venir pour le moment</p>
        </div>
      `;
    }
    return;
  }

  openShortsViewer(0);
}


export function openShortsViewer(startIndex = 0) {
  currentShortIndex = startIndex;
  isInShortsMode = true;

  pauseMainAudio();

  const viewer = document.getElementById('upcomingShortsViewer');
  if (!viewer) {
    createShortsViewer();
  }

  renderShorts();

  const viewerElement = document.getElementById('upcomingShortsViewer');
  viewerElement.classList.add('active');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    scrollToShort(currentShortIndex, false);
    playCurrentVideo();
    setupScrollListener();
  }, 100);
}

function pauseMainAudio() {
  const audio = window.audio;
  if (audio && !audio.paused) {
    wasPlayingBeforeShorts = true;
    lastPlayedTrack = {
      currentTime: audio.currentTime,
      currentIndex: window.currentIndex,
      playlist: window.playlist
    };
    audio.pause();

    const miniPlayer = document.getElementById('miniPlayer');
    if (miniPlayer) {
      miniPlayer.classList.remove('visible');
    }
  } else {
    wasPlayingBeforeShorts = false;
  }
}

function resumeMainAudio() {
  if (wasPlayingBeforeShorts && lastPlayedTrack && window.audio) {
    window.audio.currentTime = lastPlayedTrack.currentTime;
    window.audio.play().catch(() => {});

    const miniPlayer = document.getElementById('miniPlayer');
    if (miniPlayer) {
      miniPlayer.classList.add('visible');
    }
  }
}

function createShortsViewer() {
  const viewer = document.createElement('div');
  viewer.id = 'upcomingShortsViewer';
  viewer.className = 'upcoming-shorts-viewer';
  viewer.innerHTML = `
    <div class="shorts-top-overlay">
      <button class="shorts-close-btn" id="closeShortsViewer">
        <i class="fas fa-chevron-down"></i>
      </button>
      <div class="shorts-top-text">Sorties à venir</div>
      <button class="short-volume-btn" id="toggleVolume">
        <i class="fas fa-volume-up"></i>
      </button>
    </div>
    <div class="shorts-container" id="shortsContainer"></div>
  `;
  document.body.appendChild(viewer);

  document.getElementById('closeShortsViewer').addEventListener('click', closeShortsViewer);
  document.getElementById('toggleVolume').addEventListener('click', toggleVolume);
}

function renderShorts() {
  const container = document.getElementById('shortsContainer');
  if (!container) return;

  container.innerHTML = upcomingReleases.map((release, index) => {
    const releaseDate = release.release_date
      ? new Date(release.release_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    return `
      <div class="short-item" data-index="${index}">
        <video
          class="short-video"
          src="${release.video_url}"
          loop
          playsinline
          preload="metadata"
          ${isVideoMuted ? 'muted' : ''}
        ></video>

        <div class="short-overlay"></div>

        <div class="short-pause-indicator">
          <i class="fas fa-play"></i>
        </div>

        ${index === 0 ? `
          <div class="short-scroll-indicator">
            <i class="fas fa-chevron-up"></i>
            <span>Swipe</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  createFixedUI();
  setupShortInteractions();
  updateFixedUI(0);
}

function createFixedUI() {
  let fixedUI = document.getElementById('shortsFixedUI');
  if (fixedUI) {
    fixedUI.remove();
  }

  const container = document.getElementById('shortsContainer');
  fixedUI = document.createElement('div');
  fixedUI.id = 'shortsFixedUI';
  fixedUI.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 304;';

  fixedUI.innerHTML = `
    <div class="short-music-card clickable" id="shortMusicCard" style="pointer-events: auto;">
      <div class="short-music-info">
        <h3 class="short-music-title" id="shortTitle">—</h3>
        <p class="short-music-artist" id="shortArtist">—</p>
        <span class="short-release-date" id="shortReleaseDate"></span>
      </div>
      <div class="short-artist-avatar" id="shortArtistAvatar">
        <img src="" alt="Artist">
      </div>
    </div>
  `;

  container.parentElement.appendChild(fixedUI);

  document.getElementById('shortMusicCard').addEventListener('click', handleCardClick);
}

function updateFixedUI(index) {
  if (index < 0 || index >= upcomingReleases.length) return;

  const release = upcomingReleases[index];
  const releaseDate = release.release_date
    ? new Date(release.release_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  document.getElementById('shortArtistAvatar').querySelector('img').src = release.cover_url || release.artist_avatar || 'https://via.placeholder.com/56';

  document.getElementById('shortTitle').textContent = release.title;
  document.getElementById('shortArtist').textContent = release.artist_name;

  const releaseDateEl = document.getElementById('shortReleaseDate');
  if (!release.is_released && releaseDate) {
    releaseDateEl.textContent = `Disponible le ${releaseDate}`;
    releaseDateEl.style.display = 'inline-block';
  } else if (release.is_released) {
    releaseDateEl.textContent = 'Disponible maintenant';
    releaseDateEl.style.display = 'inline-block';
  } else {
    releaseDateEl.style.display = 'none';
  }

  const musicCard = document.getElementById('shortMusicCard');
  musicCard.dataset.releaseId = release.id;
  musicCard.dataset.isReleased = release.is_released;
  musicCard.dataset.spotifyUrl = release.spotify_url || '';
  musicCard.dataset.appleMusicUrl = release.apple_music_url || '';
}

function setupShortInteractions() {
  const items = document.querySelectorAll('.short-item');
  items.forEach((item, index) => {
    const video = item.querySelector('.short-video');
    const pauseIndicator = item.querySelector('.short-pause-indicator');

    video.addEventListener('click', (e) => {
      e.stopPropagation();
      if (video.paused) {
        video.play();
        pauseIndicator.classList.remove('visible');
      } else {
        video.pause();
        pauseIndicator.classList.add('visible');
      }
    });

    video.addEventListener('play', () => {
      pauseIndicator.classList.remove('visible');
    });

    video.addEventListener('pause', () => {
      pauseIndicator.classList.add('visible');
    });
  });
}

function handleCardClick(e) {
  e.stopPropagation();
  const card = e.currentTarget;
  const isReleased = card.dataset.isReleased === 'true';
  const spotifyUrl = card.dataset.spotifyUrl;
  const appleMusicUrl = card.dataset.appleMusicUrl;

  if (isReleased) {
    if (spotifyUrl) {
      window.open(spotifyUrl, '_blank');
    } else if (appleMusicUrl) {
      window.open(appleMusicUrl, '_blank');
    } else {
      console.log('Play track:', upcomingReleases[currentShortIndex].title);
    }
  } else {
    card.classList.add('saved');
    setTimeout(() => {
      card.classList.remove('saved');
    }, 1500);
  }
}

function setupScrollListener() {
  const container = document.getElementById('shortsContainer');
  if (!container) return;

  let scrollTimeout;
  let lastScrollTop = 0;

  container.addEventListener('scroll', () => {
    container.classList.add('scrolled');

    const scrollTop = container.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentShortIndex && newIndex >= 0 && newIndex < upcomingReleases.length) {
      stopAllVideos();
      currentShortIndex = newIndex;
      updateFixedUI(currentShortIndex);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        playCurrentVideo();
      }, 150);
    }

    lastScrollTop = scrollTop;
  });
}

function scrollToShort(index, smooth = true) {
  const container = document.getElementById('shortsContainer');
  if (!container) return;

  const targetScroll = index * window.innerHeight;

  if (smooth) {
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  } else {
    container.scrollTop = targetScroll;
  }
}

function playCurrentVideo() {
  const items = document.querySelectorAll('.short-item');
  if (currentShortIndex >= 0 && currentShortIndex < items.length) {
    const currentItem = items[currentShortIndex];
    const video = currentItem.querySelector('.short-video');

    if (video) {
      video.currentTime = 0;
      video.muted = isVideoMuted;
      video.play().catch(e => {
        console.log('Video autoplay prevented:', e);
      });
    }
  }
}

function stopAllVideos() {
  document.querySelectorAll('.short-video').forEach(video => {
    video.pause();
    video.currentTime = 0;
  });
}

function toggleVolume() {
  isVideoMuted = !isVideoMuted;
  const btn = document.getElementById('toggleVolume');
  const icon = btn.querySelector('i');

  if (isVideoMuted) {
    icon.className = 'fas fa-volume-mute';
    btn.classList.add('muted');
  } else {
    icon.className = 'fas fa-volume-up';
    btn.classList.remove('muted');
  }

  document.querySelectorAll('.short-video').forEach(video => {
    video.muted = isVideoMuted;
  });
}

/* Ferme la vue Sorties si elle est ouverte (ex : bouton retour du navigateur) */
export function closeUpcomingIfOpen() {
  if (isInShortsMode) closeShortsViewer({ goHome: false });
}

function closeShortsViewer({ goHome = true } = {}) {
  isInShortsMode = false;

  const viewer = document.getElementById('upcomingShortsViewer');
  viewer.classList.remove('active');
  document.body.style.overflow = '';

  stopAllVideos();

  const fixedUI = document.getElementById('shortsFixedUI');
  if (fixedUI) {
    fixedUI.remove();
  }

  resumeMainAudio();

  currentShortIndex = 0;

  if (goHome && window.showPage) {
    window.showPage('home');
  }
}

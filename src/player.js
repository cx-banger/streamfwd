const miniPlayer = document.getElementById('miniPlayer');
const fullPlayer = document.getElementById('fullPlayer');
const miniPlayerContent = document.getElementById('miniPlayerContent');
const closeFullPlayerBtn = document.getElementById('closeFullPlayer');

const miniPlayerThumb = document.getElementById('miniPlayerThumb');
const miniPlayerTitle = document.getElementById('miniPlayerTitle');
const miniPlayerArtist = document.getElementById('miniPlayerArtist');
const miniPlayPauseBtn = document.getElementById('miniPlayPause');
const miniLikeBtn = document.getElementById('miniLikeBtn');
const miniNextBtn = document.getElementById('miniNextBtn');

const fullPlayerCover = document.getElementById('fullPlayerCover');
const fullPlayerCanvas = document.getElementById('fullPlayerCanvas');
const fullPlayerTitle = document.getElementById('fullPlayerTitle');
const fullPlayerArtist = document.getElementById('fullPlayerArtist');
const fullPlayPauseBtn = document.getElementById('fullPlayPauseBtn');
const fullPrevBtn = document.getElementById('fullPrevBtn');
const fullNextBtn = document.getElementById('fullNextBtn');
const fullShuffleBtn = document.getElementById('fullShuffleBtn');
const fullRepeatBtn = document.getElementById('fullRepeatBtn');
const fullProgress = document.getElementById('fullProgress');
const fullCurrentTime = document.getElementById('fullCurrentTime');
const fullDurationTime = document.getElementById('fullDurationTime');

const playerMenuBtn = document.getElementById('playerMenuBtn');
const playerMenuPanel = document.getElementById('playerMenuPanel');
const menuPanelClose = document.getElementById('menuPanelClose');
const menuLikeBtn = document.getElementById('menuLikeBtn');
const menuAddToPlaylistBtn = document.getElementById('menuAddToPlaylistBtn');

const bottomNav = document.getElementById('bottomNav');
const lyricsContent = document.getElementById('lyricsContent');
const fullPlayerScrollable = document.getElementById('fullPlayerScrollable');
const fullPlayerCoverWrapper = document.getElementById('fullPlayerCoverWrapper');
const fullPlayerHeader = document.querySelector('.full-player-header');
const lyricsPreview = document.getElementById('lyricsPreview');

let isPlaying = false;
let isFullPlayerOpen = false;
let lastScrollY = 0;

function showMiniPlayer() {
  miniPlayer.classList.add('visible');
}

function hideMiniPlayer() {
  miniPlayer.classList.remove('visible');
}

function openFullPlayer() {
  isFullPlayerOpen = true;
  fullPlayer.classList.add('active');
  if (bottomNav) {
    bottomNav.classList.add('hidden');
  }
  updateFullPlayerUI();
}

function closeFullPlayer() {
  isFullPlayerOpen = false;
  fullPlayer.classList.remove('active');
  if (bottomNav) {
    bottomNav.classList.remove('hidden');
  }
  if (fullPlayerScrollable) {
    fullPlayerScrollable.scrollTop = 0;
  }
  if (fullPlayerCoverWrapper) {
    fullPlayerCoverWrapper.classList.remove('shrunk');
  }
  if (fullPlayerHeader) {
    fullPlayerHeader.classList.remove('scrolled');
  }
  if (lyricsPreview) {
    lyricsPreview.classList.remove('expanded');
  }
}

function updateMiniPlayer(title, artist, thumb) {
  miniPlayerTitle.textContent = title;
  miniPlayerArtist.textContent = artist;
  miniPlayerThumb.src = thumb || 'https://github.com/CX-Banger/unordered_set/blob/main/assets/disque.jpg?raw=true';
  showMiniPlayer();

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: artist,
      album: 'Muzikly',
      artwork: [
        { src: thumb || 'https://github.com/CX-Banger/unordered_set/blob/main/assets/disque.jpg?raw=true', sizes: '512x512', type: 'image/jpeg' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => {
      window.audio.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      window.audio.pause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (window.handlePrev) window.handlePrev();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (window.handleNext) window.handleNext();
    });
  }
}

function updateFullPlayerUI() {
  if (!window.playlist[window.currentIndex]) return;

  const track = window.playlist[window.currentIndex];
  fullPlayerTitle.textContent = track.title;
  fullPlayerArtist.textContent = track.artist;
  fullPlayerCover.src = track.thumb || 'https://github.com/CX-Banger/unordered_set/blob/main/assets/disque.jpg?raw=true';

  loadCanvas(track);

  updatePlayPauseButtons();
  updateShuffleRepeatButtons();
}

function loadCanvas(track) {
  if ((!track.video && !track.canvasId) || !fullPlayerCanvas) {
    console.log('Pas de video ou canvasId', track);
    hideCanvas();
    return;
  }

  const canvasUrl = track.video || `${window.SUPABASE_CANVAS_URL}/${track.canvasId}.mp4`;
  console.log('Tentative de chargement vidéo:', canvasUrl);

  fullPlayerCanvas.style.display = 'none';
  fullPlayerCanvas.src = '';

  fullPlayerCanvas.addEventListener('loadeddata', function onLoaded() {
    fullPlayerCanvas.removeEventListener('loadeddata', onLoaded);
    console.log('Vidéo chargée avec succès');
    showCanvas();
    fullPlayerCanvas.style.opacity = '1';
    if (isPlaying) {
      fullPlayerCanvas.play().catch(() => {});
    }
  }, { once: true });

  fullPlayerCanvas.addEventListener('error', function onError() {
    fullPlayerCanvas.removeEventListener('error', onError);
    console.log('Erreur de chargement vidéo, affichage du cover');
    hideCanvas();
  }, { once: true });

  fullPlayerCanvas.src = canvasUrl;
  fullPlayerCanvas.load();
}

function showCanvas() {
  if (fullPlayerCanvas) {
    fullPlayerCanvas.style.display = 'block';
    fullPlayerCanvas.style.opacity = '1';
  }
  if (fullPlayerCover) {
    fullPlayerCover.style.display = 'none';
  }
}

function hideCanvas() {
  if (fullPlayerCanvas) {
    fullPlayerCanvas.style.display = 'none';
    fullPlayerCanvas.style.opacity = '0';
    fullPlayerCanvas.pause();
    fullPlayerCanvas.src = '';
  }
  if (fullPlayerCover) {
    fullPlayerCover.style.display = 'block';
  }
}

function updatePlayPauseButtons() {
  const icon = isPlaying ? 'fa-pause' : 'fa-play';

  if (!isPlaying) {
    miniPlayPauseBtn.classList.add('playing');
    miniPlayPauseBtn.innerHTML = `<i class="fas ${icon}"></i>`;
  } else {
    miniPlayPauseBtn.classList.remove('playing');
    miniPlayPauseBtn.innerHTML = '';
  }

  const fullIcon = fullPlayPauseBtn.querySelector('i');
  if (fullIcon) {
    fullIcon.className = `fas ${icon}`;
  }
}

function updateShuffleRepeatButtons() {
  if (window.isShuffle) {
    fullShuffleBtn.classList.add('active');
  } else {
    fullShuffleBtn.classList.remove('active');
  }

  if (window.isRepeat) {
    fullRepeatBtn.classList.add('active');
  } else {
    fullRepeatBtn.classList.remove('active');
  }
}

function handlePlayPause() {
  if (window.audio.paused) {
    window.audio.play();
    isPlaying = true;
    if (fullPlayerCanvas && fullPlayerCanvas.src) {
      fullPlayerCanvas.play().catch(() => {});
    }
  } else {
    window.audio.pause();
    isPlaying = false;
    if (fullPlayerCanvas && fullPlayerCanvas.src) {
      fullPlayerCanvas.pause();
    }
  }
  updatePlayPauseButtons();
}

miniPlayerContent.addEventListener('click', (e) => {
  if (
    e.target !== miniPlayPauseBtn &&
    !miniPlayPauseBtn.contains(e.target) &&
    e.target !== miniLikeBtn &&
    !miniLikeBtn.contains(e.target) &&
    e.target !== miniNextBtn &&
    !miniNextBtn.contains(e.target)
  ) {
    openFullPlayer();
  }
});

miniPlayPauseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  handlePlayPause();
});

miniLikeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const t = window.playlist[window.currentIndex];
  if (!t) return;

  if (!window.userPlaylists['Sons Likés']) window.userPlaylists['Sons Likés'] = [];

  const alreadyLiked = window.userPlaylists['Sons Likés'].some(
    song => song.title === t.title && song.artist === t.artist
  );

  if (alreadyLiked) {
    miniLikeBtn.querySelector('i').className = 'fas fa-heart';
    setTimeout(() => {
      miniLikeBtn.querySelector('i').className = 'far fa-heart';
    }, 300);
    return;
  }

  window.userPlaylists['Sons Likés'].push({
    title: t.title,
    artist: t.artist,
    src: t.src,
    thumb: t.thumb || ''
  });

  window.savePlaylists();
  window.renderPlaylists();

  miniLikeBtn.querySelector('i').className = 'fas fa-heart';

  setTimeout(() => {
    miniLikeBtn.querySelector('i').className = 'far fa-heart';
  }, 1500);
});

miniNextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (window.handleNext) window.handleNext();
});

closeFullPlayerBtn.addEventListener('click', closeFullPlayer);

let touchStartY = 0;
let touchCurrentY = 0;
let isDragging = false;

fullPlayer.addEventListener('touchstart', (e) => {
  if (fullPlayerScrollable && fullPlayerScrollable.scrollTop > 0) {
    return;
  }

  touchStartY = e.touches[0].clientY;
  touchCurrentY = touchStartY;
  isDragging = false;
}, { passive: true });

fullPlayer.addEventListener('touchmove', (e) => {
  if (fullPlayerScrollable && fullPlayerScrollable.scrollTop > 0) {
    return;
  }

  touchCurrentY = e.touches[0].clientY;
  const deltaY = touchCurrentY - touchStartY;

  if (deltaY > 10) {
    isDragging = true;
    const translateY = Math.min(deltaY, window.innerHeight * 0.5);
    fullPlayer.style.transform = `translateY(${translateY}px)`;
    fullPlayer.style.transition = 'none';
  }
}, { passive: true });

fullPlayer.addEventListener('touchend', () => {
  if (!isDragging) {
    return;
  }

  const deltaY = touchCurrentY - touchStartY;
  const threshold = 100;

  fullPlayer.style.transition = 'transform 0.3s ease-out';

  if (deltaY > threshold) {
    fullPlayer.style.transform = `translateY(100%)`;
    setTimeout(() => {
      closeFullPlayer();
      fullPlayer.style.transform = '';
      fullPlayer.style.transition = '';
    }, 300);
  } else {
    fullPlayer.style.transform = '';
  }

  isDragging = false;
  touchStartY = 0;
  touchCurrentY = 0;
});

fullPlayPauseBtn.addEventListener('click', handlePlayPause);
fullNextBtn.addEventListener('click', () => {
  if (window.handleNext) window.handleNext();
});
fullPrevBtn.addEventListener('click', () => {
  if (window.handlePrev) window.handlePrev();
});

fullShuffleBtn.addEventListener('click', () => {
  window.isShuffle = !window.isShuffle;
  updateShuffleRepeatButtons();
});

fullRepeatBtn.addEventListener('click', () => {
  window.isRepeat = !window.isRepeat;
  updateShuffleRepeatButtons();
});

playerMenuBtn.addEventListener('click', () => {
  playerMenuPanel.classList.add('active');
});

menuPanelClose.addEventListener('click', () => {
  playerMenuPanel.classList.remove('active');
});

menuLikeBtn.addEventListener('click', () => {
  const t = window.playlist[window.currentIndex];
  if (!t) return;

  if (!window.userPlaylists['Sons Likés']) window.userPlaylists['Sons Likés'] = [];

  const alreadyLiked = window.userPlaylists['Sons Likés'].some(
    song => song.title === t.title && song.artist === t.artist
  );

  if (alreadyLiked) {
    alert('Déjà dans les Sons Likés !');
    playerMenuPanel.classList.remove('active');
    return;
  }

  window.userPlaylists['Sons Likés'].push({
    title: t.title,
    artist: t.artist,
    src: t.src,
    thumb: t.thumb || ''
  });

  window.savePlaylists();
  window.renderPlaylists();

  menuLikeBtn.querySelector('i').className = 'fas fa-heart';

  setTimeout(() => {
    menuLikeBtn.querySelector('i').className = 'far fa-heart';
    playerMenuPanel.classList.remove('active');
  }, 1500);
});

menuAddToPlaylistBtn.addEventListener('click', () => {
  const t = window.playlist[window.currentIndex];
  if (!t) return;

  const existingPlaylists = Object.keys(window.userPlaylists).filter(pl => pl !== 'Sons Likés');

  if (existingPlaylists.length === 0) {
    alert('Aucune playlist disponible. Créez d\'abord une playlist dans l\'onglet Playlists.');
    playerMenuPanel.classList.remove('active');
    return;
  }

  const playlistMenu = document.createElement('div');
  playlistMenu.className = 'playlist-selection-menu';
  playlistMenu.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #282828;
    border-radius: 8px;
    padding: 20px;
    z-index: 10000;
    max-height: 400px;
    overflow-y: auto;
    min-width: 300px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  `;

  const title = document.createElement('h3');
  title.textContent = 'Choisir une playlist';
  title.style.cssText = 'margin: 0 0 15px 0; color: white; font-size: 18px;';
  playlistMenu.appendChild(title);

  existingPlaylists.forEach(plName => {
    const btn = document.createElement('button');
    btn.textContent = plName;
    btn.style.cssText = `
      display: block;
      width: 100%;
      padding: 12px;
      margin-bottom: 8px;
      background: #404040;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-align: left;
      font-size: 14px;
      transition: background 0.2s;
    `;
    btn.onmouseover = () => btn.style.background = '#1DB954';
    btn.onmouseout = () => btn.style.background = '#404040';
    btn.onclick = () => {
      const alreadyExists = window.userPlaylists[plName].some(
        song => song.title === t.title && song.artist === t.artist
      );

      if (alreadyExists) {
        alert(`Ce titre est déjà dans "${plName}"`);
      } else {
        window.userPlaylists[plName].push({
          title: t.title,
          artist: t.artist,
          src: t.src,
          thumb: t.thumb || '',
          duration: t.duration || '0:00'
        });
        window.savePlaylists();
        window.renderPlaylists();
        alert(`Ajouté à "${plName}"`);
      }

      document.body.removeChild(playlistMenu);
      document.body.removeChild(overlay);
      playerMenuPanel.classList.remove('active');
    };
    playlistMenu.appendChild(btn);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Annuler';
  cancelBtn.style.cssText = `
    display: block;
    width: 100%;
    padding: 12px;
    margin-top: 10px;
    background: transparent;
    color: white;
    border: 1px solid #404040;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `;
  cancelBtn.onclick = () => {
    document.body.removeChild(playlistMenu);
    document.body.removeChild(overlay);
    playerMenuPanel.classList.remove('active');
  };
  playlistMenu.appendChild(cancelBtn);

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 9999;
  `;
  overlay.onclick = () => {
    document.body.removeChild(playlistMenu);
    document.body.removeChild(overlay);
    playerMenuPanel.classList.remove('active');
  };

  document.body.appendChild(overlay);
  document.body.appendChild(playlistMenu);
});

window.audio.addEventListener('timeupdate', () => {
  if (!window.audio.duration) return;

  const pct = (window.audio.currentTime / window.audio.duration) * 100;
  fullProgress.value = pct;

  const progressFill = `linear-gradient(to right, #1DB954 0%, #1DB954 ${pct}%, #404040 ${pct}%, #404040 100%)`;
  fullProgress.style.background = progressFill;

  fullCurrentTime.textContent = formatTime(window.audio.currentTime);
  fullDurationTime.textContent = formatTime(window.audio.duration);
});

fullProgress.addEventListener('input', () => {
  if (!window.audio.duration) return;
  const pct = fullProgress.value;
  window.audio.currentTime = (pct / 100) * window.audio.duration;
});

window.audio.addEventListener('play', () => {
  isPlaying = true;
  updatePlayPauseButtons();
  if (fullPlayerCanvas && fullPlayerCanvas.src) {
    fullPlayerCanvas.play().catch(() => {});
  }
});

window.audio.addEventListener('pause', () => {
  isPlaying = false;
  updatePlayPauseButtons();
  if (fullPlayerCanvas && fullPlayerCanvas.src) {
    fullPlayerCanvas.pause();
  }
});

window.audio.addEventListener('ended', () => {
  if (window.isRepeat) {
    window.audio.currentTime = 0;
    window.audio.play();
    return;
  }
  if (window.handleNext) {
    window.handleNext();
  }
});

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

if (fullPlayerScrollable) {
  fullPlayerScrollable.addEventListener('scroll', () => {
    const scrollY = fullPlayerScrollable.scrollTop;
    const coverHeight = fullPlayerCoverWrapper ? fullPlayerCoverWrapper.offsetHeight : 0;
    const threshold = 100;

    if (scrollY > threshold) {
      if (fullPlayerCoverWrapper) {
        fullPlayerCoverWrapper.classList.add('shrunk');
      }
      if (fullPlayerHeader) {
        fullPlayerHeader.classList.add('scrolled');
      }
      if (lyricsPreview) {
        lyricsPreview.classList.add('expanded');
      }
    } else {
      if (fullPlayerCoverWrapper) {
        fullPlayerCoverWrapper.classList.remove('shrunk');
      }
      if (fullPlayerHeader) {
        fullPlayerHeader.classList.remove('scrolled');
      }
      if (lyricsPreview) {
        lyricsPreview.classList.remove('expanded');
      }
    }

    const canvasOpacity = Math.max(0, 1 - (scrollY / (coverHeight * 0.8)));
    if (fullPlayerCanvas && fullPlayerCanvas.style.display === 'block') {
      fullPlayerCanvas.style.opacity = canvasOpacity;
    }

    lastScrollY = scrollY;
  });
}

if (lyricsPreview) {
  lyricsPreview.addEventListener('click', () => {
    if (lyricsPreview.classList.contains('expanded')) {
      fullPlayerScrollable.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      if (fullPlayerScrollable) {
        const coverHeight = fullPlayerCoverWrapper ? fullPlayerCoverWrapper.offsetHeight : 0;
        fullPlayerScrollable.scrollTo({
          top: coverHeight,
          behavior: 'smooth'
        });
      }
    }
  });
}

function navigateToArtist() {
  const track = window.playlist[window.currentIndex];
  if (!track || !track.artist) return;

  const artist = window.artists?.find(a => a.name === track.artist);
  if (!artist) return;

  if (isFullPlayerOpen) {
    closeFullPlayer();
  }

  if (typeof window.openArtist === 'function') {
    window.openArtist(artist);
  }
}

miniPlayerArtist.addEventListener('click', (e) => {
  e.stopPropagation();
  navigateToArtist();
});

fullPlayerArtist.addEventListener('click', (e) => {
  e.stopPropagation();
  navigateToArtist();
});

miniPlayerArtist.style.cursor = 'pointer';
fullPlayerArtist.style.cursor = 'pointer';

window.updateMiniPlayer = updateMiniPlayer;
window.updateFullPlayerUI = updateFullPlayerUI;
window.showMiniPlayer = showMiniPlayer;
window.hideMiniPlayer = hideMiniPlayer;

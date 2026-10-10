import { supabase } from './supabaseClient.js';
import { showToast } from './ui.js';

const SUPABASE_VIDEOS_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/canvas/`;

export async function initVideoManager(artists) {
  const accordion = document.getElementById('artistsVideosAccordion');
  if (!accordion) return;

  const existingVideos = await loadAllVideos();
  const videosMap = new Map();
  existingVideos.forEach(v => {
    videosMap.set(`${v.artist_name}::${v.track_title}`, v.video_url);
  });

  accordion.innerHTML = '';

  artists.forEach((artist, artistIndex) => {
    const artistSection = document.createElement('div');
    artistSection.className = 'artist-video-section';
    artistSection.innerHTML = `
      <div class="artist-video-header">
        <h3>${artist.name}</h3>
        <button class="toggle-btn" data-artist-id="${artistIndex}">
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>
      <div class="artist-video-tracks" id="artist-tracks-${artistIndex}" style="display: none;">
        ${artist.tracks.map((track, trackIndex) => {
          const videoKey = `${artist.name}::${track.title}`;
          const currentVideo = videosMap.get(videoKey);
          return `
            <div class="video-track-item">
              <div class="track-info">
                <span class="track-number">${trackIndex + 1}</span>
                <span class="track-title">${track.title}</span>
                ${currentVideo ? '<i class="fas fa-check-circle" style="color: #1DB954; margin-left: 10px;"></i>' : ''}
              </div>
              <div class="video-actions">
                <input
                  type="text"
                  class="video-url-input"
                  placeholder="URL de la vidéo dans Storage (ex: artiste1/video1.mp4)"
                  value="${currentVideo ? currentVideo.replace(SUPABASE_VIDEOS_URL, '') : ''}"
                  data-artist="${artist.name}"
                  data-track="${track.title}"
                />
                <button class="save-video-btn" data-artist="${artist.name}" data-track="${track.title}">
                  <i class="fas fa-save"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    accordion.appendChild(artistSection);

    const toggleBtn = artistSection.querySelector('.toggle-btn');
    const tracksDiv = artistSection.querySelector('.artist-video-tracks');
    toggleBtn.addEventListener('click', () => {
      const isVisible = tracksDiv.style.display !== 'none';
      tracksDiv.style.display = isVisible ? 'none' : 'block';
      toggleBtn.querySelector('i').className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    });

    const saveButtons = artistSection.querySelectorAll('.save-video-btn');
    saveButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const artistName = btn.dataset.artist;
        const trackTitle = btn.dataset.track;
        const videoTrackItem = btn.closest('.video-track-item');
        const input = videoTrackItem.querySelector('.video-url-input');
        const videoPath = input.value.trim();

        if (!videoPath) {
          showToast('Entre un chemin de vidéo valide', { icon: 'fa-circle-exclamation' });
          return;
        }

        const fullUrl = SUPABASE_VIDEOS_URL + videoPath;
        try {
          await saveVideoForTrack(artistName, trackTitle, fullUrl);
        } catch {
          showToast('Échec de l\'enregistrement (es-tu connecté ?)', { icon: 'fa-circle-exclamation' });
          return;
        }

        const existingCheck = videoTrackItem.querySelector('.fa-check-circle');
        if (!existingCheck) {
          const trackInfo = videoTrackItem.querySelector('.track-info');
          trackInfo.insertAdjacentHTML('beforeend', '<i class="fas fa-check-circle" style="color: #1DB954; margin-left: 10px;"></i>');
        }

        showToast('Vidéo enregistrée');
      });
    });
  });
}

export async function loadAllVideos() {
  const { data, error } = await supabase
    .from('track_videos')
    .select('*');

  if (error) {
    console.error('Error loading videos:', error);
    return [];
  }

  return data || [];
}

export async function saveVideoForTrack(artistName, trackTitle, videoUrl) {
  const { data, error } = await supabase
    .from('track_videos')
    .upsert({
      artist_name: artistName,
      track_title: trackTitle,
      video_url: videoUrl,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'artist_name,track_title'
    });

  if (error) {
    console.error('Error saving video:', error);
    throw error;
  }

  return data;
}

export async function getVideoForTrack(artistName, trackTitle) {
  const { data, error } = await supabase
    .from('track_videos')
    .select('video_url')
    .eq('artist_name', artistName)
    .eq('track_title', trackTitle)
    .maybeSingle();

  if (error) {
    console.error('Error getting video:', error);
    return null;
  }

  return data?.video_url || null;
}

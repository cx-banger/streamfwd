/* =====================================================================
   Événements et vidéos publiés, lus depuis Supabase (tables events / videos).
   Les fichiers eventsData.js et videosData.js servent de secours :
   si Supabase ne répond pas, l'app garde leur contenu.
   ===================================================================== */
import { sons } from './sonsClient.js';
import { EVENTS } from './eventsData.js';
import { VIDEOS } from './videosData.js';

const clean = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== ''));

export const toEvent = r => clean({
  id: r.id, type: r.type, artistId: r.artist_id, title: r.title, date: r.date, time: r.time,
  city: r.city, venue: r.venue, address: r.address, lat: r.lat, lng: r.lng,
  image: r.image, ticketUrl: r.ticket_url, transit: r.transit, status: r.status
});

export const toVideo = r => clean({
  id: r.id, type: r.type, artistId: r.artist_id, title: r.title, url: r.url, poster: r.poster,
  trackNo: r.track_no, date: r.date, eventId: r.event_id, status: r.status
});

/* Remplace le contenu des listes (sans changer de tableau : les modules qui les importent restent à jour) */
function replace(target, items) {
  target.length = 0;
  target.push(...items);
}

export async function loadLiveData() {
  try {
    const sb = sons();
    const [ev, vd] = await Promise.all([
      sb.from('events').select('*').eq('status', 'published'),
      sb.from('videos').select('*').eq('status', 'published')
    ]);
    if (ev.error || vd.error) return false;
    replace(EVENTS, ev.data.map(toEvent));
    replace(VIDEOS, vd.data.map(toVideo));
    return true;
  } catch {
    return false;
  }
}

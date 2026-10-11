/* =====================================================================
   ÉVÉNEMENTS — écrans inspirés de la partie « Concerts » de Shazam
   - #/upcoming             : accueil (événements enregistrés + explorer)
   - #/event/<id>           : fiche d'un événement
   - #/events/artist/<id>   : tous les événements d'un artiste
   ===================================================================== */

import { EVENTS, BANDSINTOWN } from './eventsData.js';
import { escapeHtml, shareLink, showToast, coverColor } from './ui.js';
import { videoForEvent } from './videos.js';
import qrcode from 'qrcode-generator';

/* Logo Muzikly (spirale) en version monochrome, comme les logos partenaires de Shazam */
const MUZIKLY_MARK = `<svg class="ev-powered-logo" viewBox="0 0 24 24" aria-hidden="true">
  <rect x="0.5" y="0.5" width="23" height="23" rx="5.5" fill="currentColor"/>
  <g transform="translate(12 12) scale(0.86) translate(-12 -12)">
    <path fill="#121212" d="M10.421 11.375c-.294 1.028.012 2.064.784 2.653 1.061.81 2.565.3 2.874-.995.08-.337.103-.722.027-1.056-.23-1.001-.52-1.988-.792-2.996-1.33.154-2.543 1.172-2.893 2.394zm5.548-.287c.273 1.012.285 2.017-.127 3-1.128 2.69-4.721 3.14-6.573.826-1.302-1.627-1.28-3.961.06-5.734.78-1.032 1.804-1.707 3.048-2.054l.379-.104c-.084-.415-.188-.816-.243-1.224-.176-1.317.512-2.503 1.744-3.04 1.226-.535 2.708-.216 3.53.76.406.479.395 1.08-.025 1.464-.412.377-.996.346-1.435-.09-.247-.246-.51-.44-.877-.436-.525.006-.987.418-.945.937.037.468.173.93.3 1.386.022.078.216.135.338.153 1.334.197 2.504.731 3.472 1.676 2.558 2.493 2.861 6.531.672 9.44-1.529 2.032-3.61 3.168-6.127 3.409-4.621.44-8.664-2.53-9.7-7.058C2.515 10.255 4.84 5.831 8.795 4.25c.586-.234 1.143-.031 1.371.498.232.537-.019 1.086-.61 1.35-2.368 1.06-3.817 2.855-4.215 5.424-.533 3.433 1.656 6.776 5 7.72 2.723.77 5.658-.166 7.308-2.33 1.586-2.08 1.4-5.099-.427-6.873a3.979 3.979 0 0 0-1.823-1.013c.198.716.389 1.388.57 2.062z"/>
  </g>
</svg>`;

/* Spirale Muzikly seule (comme la pomme dans le logo Apple Music) */
export const MUZIKLY_GLYPH = `<svg class="ev-glyph" viewBox="2.3 2.6 19.4 19.4" aria-hidden="true"><path fill="currentColor" d="M10.421 11.375c-.294 1.028.012 2.064.784 2.653 1.061.81 2.565.3 2.874-.995.08-.337.103-.722.027-1.056-.23-1.001-.52-1.988-.792-2.996-1.33.154-2.543 1.172-2.893 2.394zm5.548-.287c.273 1.012.285 2.017-.127 3-1.128 2.69-4.721 3.14-6.573.826-1.302-1.627-1.28-3.961.06-5.734.78-1.032 1.804-1.707 3.048-2.054l.379-.104c-.084-.415-.188-.816-.243-1.224-.176-1.317.512-2.503 1.744-3.04 1.226-.535 2.708-.216 3.53.76.406.479.395 1.08-.025 1.464-.412.377-.996.346-1.435-.09-.247-.246-.51-.44-.877-.436-.525.006-.987.418-.945.937.037.468.173.93.3 1.386.022.078.216.135.338.153 1.334.197 2.504.731 3.472 1.676 2.558 2.493 2.861 6.531.672 9.44-1.529 2.032-3.61 3.168-6.127 3.409-4.621.44-8.664-2.53-9.7-7.058C2.515 10.255 4.84 5.831 8.795 4.25c.586-.234 1.143-.031 1.371.498.232.537-.019 1.086-.61 1.35-2.368 1.06-3.817 2.855-4.215 5.424-.533 3.433 1.656 6.776 5 7.72 2.723.77 5.658-.166 7.308-2.33 1.586-2.08 1.4-5.099-.427-6.873a3.979 3.979 0 0 0-1.823-1.013c.198.716.389 1.388.57 2.062z"/></svg>`;

/* Photo de la carte « Les indispensables » (Pont des Arts, Paris — Wikimedia Commons, version 1280 px) */
const MOOD_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Pont_des_Arts%2C_Paris.jpg/1280px-Pont_des_Arts%2C_Paris.jpg';

const ms = (name, fill = false) => `<span class="ms${fill ? ' ms-fill' : ''}">${name}</span>`;

const TYPE_LABELS = {
  concert: { upcoming: 'Concert à venir', guide: 'Guide du concert', short: 'Concert' },
  scene:   { upcoming: 'Scène ouverte à venir', guide: 'Guide de la scène ouverte', short: 'Scène ouverte' },
  album:   { upcoming: 'Sortie à venir', guide: 'Guide de la sortie', short: 'Sortie' }
};

/* ---------- Données ---------- */
function artistOf(ev) {
  return ev.artistId ? (window.artists || []).find(a => a.id === ev.artistId) || null : null;
}
function eventName(ev) {
  return ev.title || artistOf(ev)?.name || 'Événement';
}
/* Affiche par défaut des événements (quand un événement n'a pas sa propre image) */
const DEFAULT_POSTER = 'https://raw.githubusercontent.com/cx-banger/cxapp.ico/main/_drafts/%23E74B3b.png';

function eventImage(ev) {
  return ev.image || DEFAULT_POSTER;
}
function eventDate(ev) {
  return new Date(`${ev.date}T${ev.time || '00:00'}:00`);
}
function upcomingEvents() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return EVENTS.filter(ev => eventDate(ev) >= today).sort((a, b) => eventDate(a) - eventDate(b));
}
function findEvent(id) {
  return EVENTS.find(ev => ev.id === id) || null;
}

/* Dates en français, comme Shazam : « jeu. 19 nov. 2026 », « 19 nov. 2026 », « NOV. » */
const fmt = (opts) => new Intl.DateTimeFormat('fr-FR', opts);
const shortDate = d => fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(d);
const dayShortDate = d => fmt({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d);
const weekday = d => fmt({ weekday: 'long' }).format(d);
const monthYear = d => fmt({ month: 'long', year: 'numeric' }).format(d);
const monthShort = d => fmt({ month: 'short' }).format(d).toUpperCase().replace(/\.?$/, '.');

/* ---------- Événements enregistrés (« Ajouté ») ---------- */
function getSaved() {
  try { return JSON.parse(localStorage.getItem('savedEvents') || '[]'); } catch { return []; }
}
function isSaved(id) { return getSaved().includes(id); }
function toggleSaved(id) {
  const saved = getSaved();
  const i = saved.indexOf(id);
  if (i >= 0) saved.splice(i, 1); else saved.push(id);
  try { localStorage.setItem('savedEvents', JSON.stringify(saved)); } catch {}
  showToast(i >= 0 ? 'Retiré de tes événements' : 'Ajouté à tes événements', { icon: i >= 0 ? 'event_busy' : 'event_available' });
  return i < 0;
}

/* ---------- Actions ---------- */
function shareEvent(ev) {
  const url = `${location.origin}${location.pathname}#/event/${ev.id}`;
  shareLink({ title: eventName(ev), text: `${eventName(ev)} — ${shortDate(eventDate(ev))}`, url });
}

/* Ajout au calendrier : fichier .ics reconnu par Google Agenda, Apple Calendrier, Outlook */
function downloadIcs(ev) {
  const start = eventDate(ev);
  const end = new Date(start.getTime() + 2 * 3600 * 1000);
  const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Muzikly//Evenements//FR', 'BEGIN:VEVENT',
    `UID:${ev.id}@muzikly`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${eventName(ev)}`,
    `LOCATION:${[ev.venue, ev.address, ev.city].filter(Boolean).join(', ')}`,
    `URL:${location.origin}${location.pathname}#/event/${ev.id}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `${ev.id}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function openMap(ev) {
  const q = encodeURIComponent([ev.venue, ev.address, ev.city].filter(Boolean).join(', '));
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener');
}

/* Itinéraire en transports en commun jusqu'au lieu */
function openRoute(ev) {
  const q = encodeURIComponent([ev.venue, ev.address, ev.city].filter(Boolean).join(', '));
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=transit`, '_blank', 'noopener');
}

/* ---------- Accès en transports, façon signalétique SNCF ----------
   ev.transit = {
     stop: 'Place de Clichy',                       // arrêt ou gare d'arrivée
     legs: [{ mode: 'metro', lines: ['2', '13'] },  // étapes dans l'ordre : tgv, train, rer, metro, tram, bus
            { mode: 'bus', lines: ['30'] }],
     walk: 4                                        // minutes à pied jusqu'au lieu
   }
   (ancien format accepté : { stop, mode, lines, walk }) */
const TRANSIT_MODES = {
  tgv:   { icon: 'train', label: 'TGV' },
  train: { icon: 'train', label: 'Train' },
  rer:   { icon: 'train', label: 'RER' },
  metro: { icon: 'subway', label: 'Métro' },
  tram:  { icon: 'tram', label: 'Tram' },
  bus:   { icon: 'directions_bus', label: 'Bus' }
};
export const TRANSIT_ORDER = Object.keys(TRANSIT_MODES);

function transitLegs(t) {
  if (!t) return [];
  const legs = Array.isArray(t.legs) ? t.legs : (t.mode ? [{ mode: t.mode, lines: t.lines }] : []);
  return legs.filter(l => TRANSIT_MODES[l.mode]).map(l => ({ mode: l.mode, lines: (l.lines || []).filter(Boolean) }));
}
const hasTransit = ev => !!(ev.transit && (transitLegs(ev.transit).length || ev.transit.walk));

/* Pictogrammes de la maquette (train, chevron, marcheur) */
const SVG_TRAIN = '<svg class="tr-ico" width="14" height="19" viewBox="0 0 14 19.37" aria-hidden="true"><path fill="currentColor" d="M0.986087 19.1929L1.91391 18.1969H12.1196L13.0474 19.1929C13.096 19.2484 13.1565 19.293 13.2247 19.3235C13.2929 19.3541 13.3672 19.37 13.4423 19.37C13.5174 19.37 13.5917 19.3541 13.6599 19.3235C13.7281 19.293 13.7886 19.2484 13.8372 19.1929C13.9422 19.0747 14 18.9238 14 18.7678C14 18.6117 13.9422 18.4609 13.8372 18.3426L11.15 15.4515C11.2097 15.415 11.2657 15.3729 11.3172 15.326C11.9274 14.8184 12.3778 14.1547 12.6169 13.4107C13.1082 12.1623 13.4109 10.8518 13.5155 9.51952C13.6408 7.75813 12.8927 5.02084 12.3954 3.7413L12.224 3.29184C11.906 2.68573 11.4818 2.13771 10.9703 1.67218C10.3476 1.04455 9.75412 1 8.84305 1H5.157C4.24593 1 3.64826 1.04455 3.02974 1.67218C2.51727 2.13688 2.09292 2.68507 1.77597 3.29184L1.60466 3.74535C1.10733 5.02084 0.350865 7.75814 0.4846 9.52357C0.588552 10.8546 0.891225 12.1639 1.38314 13.4107C1.62224 14.1547 2.07266 14.8184 2.68288 15.326C2.73551 15.3703 2.79139 15.4109 2.85006 15.4475L0.162792 18.3426C0.0577658 18.4609 0 18.6117 0 18.7678C0 18.9238 0.0577658 19.0747 0.162792 19.1929C0.211441 19.2484 0.271979 19.293 0.340174 19.3235C0.40837 19.3541 0.482619 19.37 0.557757 19.37C0.632896 19.37 0.707094 19.3541 0.775289 19.3235C0.843485 19.293 0.904023 19.2484 0.952672 19.1929H0.986087ZM2.99632 16.9943L3.98261 15.9252C4.39461 16.0095 4.81547 16.0462 5.23638 16.0346H8.73857C9.1595 16.0467 9.58041 16.01 9.99234 15.9252L10.9828 16.9943H2.99632ZM10.218 14.3946C10.0354 14.3946 9.85675 14.3422 9.70487 14.2439C9.55298 14.1456 9.43465 14.0057 9.36474 13.8422C9.29484 13.6787 9.27651 13.4988 9.31214 13.3252C9.34778 13.1516 9.43576 12.9922 9.56493 12.867C9.6941 12.7419 9.85868 12.6567 10.0378 12.6221C10.217 12.5876 10.4027 12.6053 10.5715 12.6731C10.7402 12.7408 10.8845 12.8555 10.986 13.0026C11.0875 13.1498 11.1416 13.3228 11.1416 13.4998C11.1416 13.7371 11.0443 13.9648 10.8711 14.1326C10.6979 14.3004 10.463 14.3946 10.218 14.3946ZM1.85958 8.6651C1.29539 8.6651 2.18138 3.86684 2.58676 3.86684H11.2628C11.6808 3.86684 12.7339 8.6651 12.0402 8.6651H1.85958ZM2.79991 13.4998C2.79991 13.3228 2.85407 13.1498 2.95556 13.0026C3.05705 12.8555 3.20129 12.7408 3.37006 12.6731C3.53883 12.6053 3.72453 12.5876 3.90369 12.6221C4.08285 12.6567 4.24744 12.7419 4.37661 12.867C4.50578 12.9922 4.5937 13.1516 4.62934 13.3252C4.66498 13.4988 4.6467 13.6787 4.57679 13.8422C4.50689 14.0057 4.38851 14.1456 4.23662 14.2439C4.08473 14.3422 3.90617 14.3946 3.7235 14.3946C3.47854 14.3946 3.2436 14.3004 3.07039 14.1326C2.89718 13.9648 2.79991 13.7371 2.79991 13.4998Z"/></svg>';
const SVG_CHEV = '<svg class="tr-chev" width="6" height="10" viewBox="180 5.5 6 10" aria-hidden="true"><path d="M181 6.5L184.5 10.5L181 14.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const SVG_WALK = '<svg class="tr-walk-ico" width="11" height="20" viewBox="202 1 11 20" aria-hidden="true"><path fill="currentColor" d="M208.346 4.72093C209.277 4.72093 210.038 3.88372 210.038 2.86047C210.038 1.83721 209.277 1 208.346 1C207.415 1 206.654 1.83721 206.654 2.86047C206.654 3.88372 207.415 4.72093 208.346 4.72093ZM205.215 7.88372L202.846 21H204.623L206.146 13.5581L207.923 15.4186V21H209.615V14.0233L207.838 12.1628L208.346 9.37209C209.446 10.7674 211.138 11.6977 213 11.6977V9.83721C211.392 9.83721 210.038 8.90698 209.362 7.60465L208.515 6.11628C208.042 5.28837 207.094 4.95349 206.273 5.33488L202 7.32558V11.6977H203.692V8.53488L205.215 7.88372Z"/></svg>';

/* Trajet par défaut sur chaque ticket tant que l'événement n'a pas le sien (à personnaliser dans l'Espace artiste) */
const DEFAULT_TRANSIT = { legs: [{ mode: 'train', lines: ['166', '348D', '362C'] }], walk: 6 };
const ticketTransit = ev => (hasTransit(ev) ? ev.transit : DEFAULT_TRANSIT);

function transitStrip(t) {
  const legs = transitLegs(t);
  const parts = legs.map(l => {
    const mode = TRANSIT_MODES[l.mode];
    const icon = ['train', 'tgv', 'rer'].includes(l.mode) ? SVG_TRAIN : ms(mode.icon, true);
    const pills = l.lines.length ? l.lines : (l.mode === 'tgv' ? ['TGV'] : []);
    return `<span class="tr-leg tr-${l.mode}"><span class="tr-mode" title="${mode.label}">${icon}</span>${
      pills.length ? `<span class="tr-lines">${pills.map(x => `<span>${escapeHtml(x)}</span>`).join('')}</span>` : ''}</span>`;
  });
  if (t.walk) parts.push(`<span class="tr-walk" title="${Number(t.walk)} min à pied">${SVG_WALK}<small>${Number(t.walk)}</small></span>`);
  const label = [legs.map(l => TRANSIT_MODES[l.mode].label).join(' + '), t.stop, t.walk ? `${Number(t.walk)} min à pied` : ''].filter(Boolean).join(' · ');
  return `<span class="tr-strip" title="${escapeHtml(label)}">${parts.join(SVG_CHEV)}</span>`;
}

/* Panneau jaune de l'arrêt (comme les panneaux de gare) */
/* (avec l'icône du dernier transport : c'est là qu'on descend) */
function stationSign(t) {
  const last = transitLegs(t).slice(-1)[0];
  const icon = last ? TRANSIT_MODES[last.mode].icon : 'directions_walk';
  return `<span class="tr-sign"><strong>${escapeHtml(t.stop)}</strong>${ms(icon)}</span>`;
}

/* ---------- QR code du ticket : ouvre la fiche de l'événement ---------- */
function eventQr(ev) {
  const qr = qrcode(0, 'M');
  qr.addData(`${location.origin}${location.pathname}#/event/${encodeURIComponent(ev.id)}`);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return `<svg class="ev-ticket-qr" viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="QR code de l'événement" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

function playArtist(artist, index = 0) {
  if (!artist || !artist.tracks.length) return;
  window.playlist = artist.tracks.map(t => ({
    src: Array.isArray(t.src) ? t.src[0] : t.src, title: t.title, artist: artist.name,
    thumb: t.cover || artist.photo, canvasId: t.canvasId, video: t.video
  }));
  window.loadAndPlay(index);
}

/* =====================================================================
   1. ACCUEIL ÉVÉNEMENTS (Shazam : « Concerts »)
   ===================================================================== */
let homeType = 'all';   // menu « Pour vous ⌄ »
let homeWhere = 'all';  // « Partout » ou « À proximité »
let userPos = null;
const NEAR_KM = 100;
const TYPE_MENU = [
  { key: 'all', label: 'Pour vous', sub: 'Prochains événements des artistes Muzikly' },
  { key: 'scene', label: 'Scènes ouvertes', sub: 'Prochaines scènes ouvertes Muzikly' },
  { key: 'album', label: 'Sorties', sub: 'Prochains albums et singles des artistes Muzikly' },
  { key: 'concert', label: 'Concerts', sub: 'Prochains concerts des artistes Muzikly' }
];

/* Distance à vol d'oiseau (km) entre deux points */
function distanceKm(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function eventCard(ev) {
  const d = eventDate(ev);
  const artist = artistOf(ev);
  const sub = ev.type === 'album'
    ? 'Sortie sur Muzikly'
    : [ev.venue, ev.city].filter(Boolean).join(', ');
  return `
    <a class="ev-card" href="#/event/${encodeURIComponent(ev.id)}">
      <img class="ev-card-img" src="${eventImage(ev)}" alt="" loading="lazy">
      <div class="ev-card-date">${ms('calendar_today')}<span>${shortDate(d)}</span></div>
      <div class="ev-card-name">${escapeHtml(eventName(ev))}</div>
      <div class="ev-card-sub">${escapeHtml(artist && ev.title ? `${artist.name} · ${sub}` : sub)}</div>
    </a>`;
}

function savedTicket(ev) {
  const d = eventDate(ev);
  const place = ev.type === 'album' ? 'Sortie sur Muzikly' : [ev.venue, ev.city].filter(Boolean).join(', ');
  return `
    <div class="ev-ticket">
      <a class="ev-ticket-top" href="#/event/${encodeURIComponent(ev.id)}">
        <img class="ev-ticket-photo" src="${eventImage(ev)}" alt="" loading="lazy">
        <div class="ev-ticket-text">
          <div class="ev-ticket-date">${dayShortDate(d)}</div>
          <div class="ev-ticket-name">${escapeHtml(eventName(ev))}</div>
          <div class="ev-ticket-place">${escapeHtml(place)}</div>
        </div>
        ${eventQr(ev)}
        <span class="ev-ticket-more">${ms('more_vert')}</span>
      </a>
      <a class="ev-ticket-bottom" href="#/event/${encodeURIComponent(ev.id)}">
        <span class="ev-ticket-guide">Voir le guide<span class="ev-g-long"> de l'événement</span></span>
        ${transitStrip(ticketTransit(ev))}
      </a>
    </div>`;
}

export function renderEventsHome(container) {
  const saved = upcomingEvents().filter(ev => isSaved(ev.id));
  const typeLabel = TYPE_MENU.find(t => t.key === homeType).label;
  let list = upcomingEvents().filter(ev => homeType === 'all' || ev.type === homeType);
  if (homeWhere === 'near' && userPos) {
    list = list
      .filter(ev => typeof ev.lat === 'number' && distanceKm(userPos, ev) <= NEAR_KM)
      .sort((a, b) => distanceKm(userPos, a) - distanceKm(userPos, b));
  }

  container.innerHTML = `
    <div class="ev-screen ev-home">
      <header class="ev-home-head">
        <h1>Événements</h1>
        <div class="ev-dots" aria-hidden="true"><span></span><span></span><span class="on"></span></div>
        <a class="ev-icon-btn ev-home-search" href="#/search" aria-label="Rechercher">${ms('search')}</a>
      </header>

      <h2 class="ev-h1">Événements enregistrés</h2>
      ${saved.length ? saved.map(savedTicket).join('') : `
        <div class="ev-ticket ev-ticket-empty">
          <div class="ev-ticket-top">
            <div class="ev-ticket-photo ev-ticket-placeholder">${ms('person', true)}</div>
            <div class="ev-ticket-text">
              <div class="ev-ticket-date">Aucun événement enregistré</div>
              <div class="ev-ticket-name">Garde tes dates ici</div>
              <div class="ev-ticket-place">Touche « Ajouter » sur un événement</div>
            </div>
          </div>
          <div class="ev-ticket-bottom">Les événements ajoutés apparaissent ici</div>
        </div>`}

      <hr class="ev-sep">

      <h2 class="ev-h1 ev-explore">Explorer : <button type="button" class="ev-blue ev-type-btn" aria-haspopup="true">${typeLabel} ${ms('expand_more')}</button></h2>
      <div class="ev-type-menu" hidden>
        ${TYPE_MENU.map(t => `<button type="button" data-type="${t.key}" class="${t.key === homeType ? 'on' : ''}">${t.label}${t.key === homeType ? ms('check') : ''}</button>`).join('')}
      </div>
      <p class="ev-explore-sub">${TYPE_MENU.find(t => t.key === homeType).sub}</p>
      <div class="ev-pills">
        <button type="button" class="ev-pill${homeWhere === 'all' ? ' on' : ''}" data-where="all">${ms('location_on')}<span>Partout</span></button>
        <button type="button" class="ev-pill${homeWhere === 'near' ? ' on' : ''}" data-where="near">${ms('my_location')}<span>À proximité</span></button>
      </div>
      <div class="ev-grid">
        ${list.length ? list.map(eventCard).join('') : `<p class="ev-empty">${homeWhere === 'near' ? `Aucun événement à moins de ${NEAR_KM} km.` : 'Aucun événement à venir pour le moment.'}</p>`}
      </div>
    </div>`;

  // Menu « Pour vous ⌄ » : type d'événement
  const menu = container.querySelector('.ev-type-menu');
  container.querySelector('.ev-type-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    // Le menu s'ouvre juste sous « Pour vous ⌄ », quelle que soit la largeur de la fenêtre
    const btn = e.currentTarget;
    menu.style.left = `${Math.max(8, btn.offsetLeft - 16)}px`;
    menu.hidden = !menu.hidden;
  });
  menu.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => {
    homeType = b.dataset.type;
    renderEventsHome(container);
  }));
  document.addEventListener('click', () => { menu.hidden = true; }, { once: true });

  // Partout / À proximité (demande la position de l'appareil)
  container.querySelectorAll('[data-where]').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.where === 'all') { homeWhere = 'all'; return renderEventsHome(container); }
    if (!navigator.geolocation) return showToast('Ta position n\'est pas disponible sur cet appareil', { icon: 'location_on' });
    navigator.geolocation.getCurrentPosition(
      pos => {
        userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        homeWhere = 'near';
        renderEventsHome(container);
      },
      () => showToast('Autorise l\'accès à ta position pour voir les événements proches', { icon: 'location_on' }),
      { maximumAge: 10 * 60 * 1000, timeout: 10000 }
    );
  }));
}

/* =====================================================================
   2. FICHE D'UN ÉVÉNEMENT (Shazam : page d'un concert)
   ===================================================================== */
export function renderEventDetail(container, id) {
  const ev = findEvent(id);
  if (!ev) {
    container.innerHTML = `<div class="ev-screen"><header class="ev-bar">
      <a class="ev-icon-btn" href="#/upcoming" aria-label="Retour">${ms('arrow_back')}</a><h1>Événement introuvable</h1></header>
      <p class="ev-empty">Cet événement n'existe plus.</p></div>`;
    return;
  }
  const d = eventDate(ev);
  const artist = artistOf(ev);
  const labels = TYPE_LABELS[ev.type] || TYPE_LABELS.concert;
  const isAlbum = ev.type === 'album';
  const placeLine = isAlbum ? 'Sur Muzikly' : ev.city;
  const others = upcomingEvents().filter(o => o.id !== ev.id && (artist ? o.artistId === ev.artistId : o.type === ev.type));
  // Teaser : rangé dans la section Vidéos (videosData.js, champ eventId)
  const teaser = videoForEvent(ev.id);
  const teaserFile = teaser && !/youtu/.test(teaser.url) ? teaser.url : '';
  const shareBtn = `<button type="button" class="ev-btn" data-action="share">${ms('share')}<span>Partager</span></button>`;
  const firstBtn = isAlbum
    ? (teaser ? `<a class="ev-btn" href="#/video/${encodeURIComponent(teaser.id)}">${ms('play_arrow', true)}<span>Teaser</span></a>` : shareBtn)
    : (ev.ticketUrl ? `<a class="ev-btn" href="${escapeHtml(ev.ticketUrl)}" target="_blank" rel="noopener">${ms('confirmation_number', true)}<span>${ev.type === 'scene' ? 'Inscription' : 'Billets'}</span></a>` : shareBtn);

  container.innerHTML = `
    <div class="ev-screen ev-detail">
        <header class="ev-bar ev-bar-hero">
          <a class="ev-icon-btn" href="#/upcoming" aria-label="Retour">${ms('arrow_back')}</a>
          <div class="ev-bar-title"><strong>${escapeHtml(eventName(ev))}</strong><small>${shortDate(d)}${placeLine ? ` | ${escapeHtml(placeLine)}` : ''}</small></div>
          <button type="button" class="ev-icon-btn" data-action="share" aria-label="Partager">${ms('share')}</button>
          <button type="button" class="ev-icon-btn" data-action="calendar" aria-label="Ajouter au calendrier">${ms('more_vert')}</button>
        </header>
      <section class="ev-hero">
        ${teaserFile
          ? `<video class="ev-hero-media" src="${escapeHtml(teaserFile)}" poster="${eventImage(ev)}" muted loop playsinline autoplay></video>`
          : `<img class="ev-hero-media" src="${eventImage(ev)}" alt="">`}
        <div class="ev-hero-shade"></div>
        <div class="ev-hero-body">
          <p class="ev-hero-kicker">${labels.upcoming}</p>
          <h1 class="ev-hero-title">${escapeHtml(eventName(ev))}</h1>
          <p class="ev-hero-meta">${shortDate(d)}${placeLine ? ` | ${escapeHtml(placeLine)}` : ''}</p>
          <div class="ev-hero-btns${firstBtn ? '' : ' single'}">
            ${firstBtn}
            <button type="button" class="ev-btn" data-action="save"></button>
          </div>
        </div>
      </section>

      <section class="ev-section ev-s-guide">
        <h2 class="ev-h2">${labels.guide}</h2>
        <div class="ev-guide">
          <button type="button" class="ev-guide-row" data-action="calendar">
            <span class="ev-guide-text"><small>${weekday(d)}</small><strong>${shortDate(d)} · ${isAlbum ? 'Disponible à' : 'Commence à'} ${ev.time || '00:00'}</strong></span>
            <span class="ev-guide-icon">${ms('event', true)}</span>
          </button>
          ${isAlbum ? `
          <div class="ev-guide-row">
            <span class="ev-guide-text"><small>En ligne</small><strong>Sur Muzikly${artist ? `, dans le profil de ${escapeHtml(artist.name)}` : ''}</strong></span>
            <span class="ev-guide-icon">${ms('library_music', true)}</span>
          </div>` : `
          <button type="button" class="ev-guide-row" data-action="map">
            <span class="ev-guide-text"><small>${escapeHtml(ev.city || '')}</small><strong>${escapeHtml([ev.venue, ev.address].filter(Boolean).join(', '))}</strong></span>
            <span class="ev-guide-icon">${ms('location_on', true)}</span>
          </button>
          <button type="button" class="ev-guide-row ev-guide-transit" data-action="route">
            <span class="ev-guide-text"><small>S'y rendre</small>${hasTransit(ev)
              ? `<span class="tr-row">${ev.transit.stop ? stationSign(ev.transit) : ''}${transitStrip(ev.transit)}</span>`
              : '<strong>Itinéraire en transports en commun</strong>'}</span>
            <span class="ev-guide-icon">${ms('directions_transit', true)}</span>
          </button>`}
        </div>
        <p class="ev-powered">Publié par ${MUZIKLY_MARK} Muzikly</p>
      </section>

      ${artist ? `
      <section class="ev-section ev-s-mood">
        <h2 class="ev-h2">Mettez-vous dans l'ambiance</h2>
        <button type="button" class="ev-mood" data-action="play-all">
          <span class="ev-mood-band">
            <span class="ev-mood-logo">${MUZIKLY_GLYPH}Muzikly</span>
            <span class="ev-mood-title">Les indispensables<br>à Paris</span>
          </span>
          <img class="ev-mood-img" src="${MOOD_IMAGE}" alt="" loading="lazy">
        </button>
        <div class="ev-mood-foot">
          <div><strong>${escapeHtml(artist.name)} : les indispensables</strong><small>${artist.tracks.length} titres</small></div>
          <button type="button" class="ev-play-white" data-action="play-all" aria-label="Lire">${ms('play_arrow', true)}</button>
        </div>
      </section>

      <section class="ev-section ev-s-listen">
        <h2 class="ev-h2">Écouter ${escapeHtml(artist.name)}</h2>
        ${listenBlock(artist)}
      </section>` : ''}

      ${others.length ? `
      <section class="ev-section ev-s-next">
        <div class="ev-h2-row"><h2 class="ev-h2">${artist ? 'Événements à venir' : `Autres ${labels.short.toLowerCase()}s`}</h2>
          ${artist ? `<a class="ev-link" href="#/events/artist/${artist.id}">Voir</a>` : ''}</div>
        ${others.slice(0, 3).map(o => nextRow(o)).join('')}
      </section>` : ''}
      ${artist ? bandsintownSection(artist) : ''}
    </div>`;

  loadBandsintown();

  // Bouton « Ajouter / Ajouté »
  const saveBtn = container.querySelector('[data-action="save"]');
  const paintSave = () => {
    const on = isSaved(ev.id);
    saveBtn.innerHTML = on
      ? `<span class="ev-check">${ms('check', true)}</span><span>Ajouté</span>`
      : `${ms('add_circle', true)}<span>Ajouter</span>`;
    saveBtn.classList.toggle('on', on);
  };
  paintSave();

  container.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', (e) => {
    const action = el.dataset.action;
    if (action === 'save') { toggleSaved(ev.id); paintSave(); }
    if (action === 'share') shareEvent(ev);
    if (action === 'calendar') downloadIcs(ev);
    if (action === 'map') openMap(ev);
    if (action === 'route') openRoute(ev);
    if (action === 'play-all') playArtist(artist, 0);
    if (action === 'play-track') { e.preventDefault(); playArtist(artist, Number(el.dataset.index)); }
  }));

  // Couleur du bandeau « Les indispensables » et de l'ombre du haut tirée de la photo
  const bar = container.querySelector('.ev-bar-hero');
  const scroller = document.querySelector('.pages');
  const onScroll = () => {
    if (!container.contains(bar)) return scroller.removeEventListener('scroll', onScroll);
    const hero = container.querySelector('.ev-hero');
    const start = hero.offsetHeight - 260, end = hero.offsetHeight - 64;
    const t = Math.min(1, Math.max(0, (scroller.scrollTop - start) / (end - start)));
    bar.style.setProperty('--bar-o', t);
  };
  scroller.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  coverColor(eventImage(ev)).then(c => { if (c) container.querySelector('.ev-detail')?.style.setProperty('--ev-tint', c); });
  if (artist) coverColor(MOOD_IMAGE).then(c => { if (c) container.querySelector('.ev-mood-band')?.style.setProperty('background', c.replace(/(\d+)%\)$/, (m, l) => `${Math.min(80, Number(l) + 42)}%)`)); });
}

/* Bloc « Écouter … » : dernier titre en grand, puis colonnes de 3 titres */
function listenBlock(artist) {
  const tracks = artist.tracks.map((t, i) => ({ t, i })).reverse();
  const [first, ...rest] = tracks;
  const badge = `<span class="ev-badge">${MUZIKLY_GLYPH}Muzikly</span>`;
  const cols = [];
  for (let i = 0; i < rest.length; i += 3) cols.push(rest.slice(i, i + 3));
  return `
    <div class="ev-feature">
      <button type="button" class="ev-cover ev-cover-lg" data-action="play-track" data-index="${first.i}" aria-label="Lire ${escapeHtml(first.t.title)}">
        <img src="${first.t.cover}" alt="" loading="lazy"><span class="ev-cover-play">${ms('play_arrow', true)}</span>
      </button>
      <div class="ev-feature-text">
        <small>Dernière sortie</small>
        <strong>${escapeHtml(first.t.title)}</strong>
        <small>${escapeHtml(artist.name)}</small>
        ${badge}
      </div>
    </div>
    ${cols.length ? `<hr class="ev-line">
    <div class="ev-cols">
      ${cols.map(col => `<div class="ev-col">${col.map(({ t, i }) => `
        <div class="ev-track">
          <button type="button" class="ev-cover" data-action="play-track" data-index="${i}" aria-label="Lire ${escapeHtml(t.title)}">
            <img src="${t.cover}" alt="" loading="lazy"><span class="ev-cover-play">${ms('play_arrow', true)}</span>
          </button>
          <div class="ev-track-text"><strong>${escapeHtml(t.title)}</strong><small>${escapeHtml(artist.name)}</small>${badge}</div>
        </div>`).join('')}</div>`).join('')}
    </div>` : ''}`;
}

/* Ligne « style Bandsintown » : date à gauche, lieu + ville au centre, bouton à droite.
   withName : affiche aussi le nom de l'artiste / de l'événement (listes qui mélangent les artistes) */
function nextRow(o, { withName = false } = {}) {
  const od = eventDate(o);
  const isAlbum = o.type === 'album';
  const when = `${weekday(od)}${o.time && o.time !== '00:00' ? ' à ' + o.time : ''}`;
  const title = withName ? eventName(o) : (isAlbum ? eventName(o) : (o.venue || eventName(o)));
  const place = isAlbum ? 'Sortie sur Muzikly' : (withName ? [o.venue, o.city].filter(Boolean).join(', ') : (o.city || ''));
  return `<a class="ev-next" href="#/event/${encodeURIComponent(o.id)}">
    <span class="ev-bit-date"><span class="ev-bit-m">${monthShort(od).replace('.', '')}</span><span class="ev-bit-d">${od.getDate()}</span></span>
    <span class="ev-next-text"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(place)} · ${when}</small></span>
    <span class="ev-bit-btn">${o.ticketUrl ? (o.type === 'scene' ? 'Inscription' : 'Billets') : 'Détails'}</span>
  </a>`;
}

/* Section « Événements à venir » réutilisable (ex. en bas de la page Explorer) */
export function renderUpcomingSection(el, max = 5) {
  const list = upcomingEvents().slice(0, max);
  if (!el) return;
  if (!list.length) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="ev-screen ev-embed">
      <section class="ev-section ev-s-next">
        <div class="ev-h2-row"><h2 class="ev-h2">Événements à venir</h2><a class="ev-link" href="#/upcoming">Voir</a></div>
        ${list.map(o => nextRow(o, { withName: true })).join('')}
      </section>
    </div>`;
}

/* Indicatif sur la page de profil d'un artiste : son prochain événement (ou rien) */
export function renderArtistEventBadge(el, artist) {
  if (!el) return;
  const list = upcomingEvents().filter(ev => artist && ev.artistId === artist.id);
  if (!list.length) { el.hidden = true; return; }
  const ev = list[0];
  const d = eventDate(ev);
  const label = { concert: 'Concert', scene: 'Scène ouverte', album: 'Sortie' }[ev.type] || 'Événement';
  const where = ev.type === 'album' ? '' : (ev.city ? ` · ${escapeHtml(ev.city)}` : '');
  const more = list.length > 1 ? `<span class="aeb-more">+${list.length - 1}</span>` : '';
  el.href = list.length > 1 ? `#/events/artist/${artist.id}` : `#/event/${encodeURIComponent(ev.id)}`;
  el.innerHTML = `<span class="aeb-dot" aria-hidden="true"></span><span class="aeb-text"><strong>${label}</strong> le ${shortDate(d)}${where}</span>${more}${ms('chevron_right')}`;
  el.setAttribute('aria-label', `${label} le ${shortDate(d)}, voir l'événement`);
  el.hidden = false;
}

/* =====================================================================
   WIDGET OFFICIEL « BANDSINTOWN FOR ARTISTS »
   Affiché seulement si l'artiste a un identifiant dans BANDSINTOWN (eventsData.js).
   ===================================================================== */
function bandsintownSection(artist) {
  const bitName = BANDSINTOWN[artist.id];
  if (!bitName) return '';
  return `
    <section class="ev-section ev-s-bit">
      <h2 class="ev-h2">Concerts de ${escapeHtml(artist.name)}</h2>
      <a class="bit-widget-initializer"
        data-artist-name="${escapeHtml(bitName)}"
        data-language="fr"
        data-font="Roboto"
        data-auto-style="false"
        data-background-color="rgba(0,0,0,0)"
        data-text-color="#FFFFFF"
        data-separator-color="rgba(255,255,255,0.12)"
        data-link-color="#0077FF"
        data-link-text-color="#FFFFFF"
        data-popup-background-color="#1C1C1E"
        data-display-local-dates="false"
        data-display-past-dates="false"
        data-display-lineup="false"
        data-display-play-my-city="true"
        data-display-start-time="true"
        data-display-limit="10"
        data-date-format="ddd D MMM"
        data-widget-width="100%"></a>
    </section>`;
}

/* Charge (ou recharge) le script officiel : il remplit chaque .bit-widget-initializer de la page */
function loadBandsintown() {
  if (!document.querySelector('.bit-widget-initializer')) return;
  document.getElementById('bit-widget-script')?.remove();
  const script = document.createElement('script');
  script.id = 'bit-widget-script';
  script.charset = 'utf-8';
  script.src = 'https://widgetv3.bandsintown.com/main.min.js';
  document.body.appendChild(script);
}

/* =====================================================================
   3. ÉVÉNEMENTS D'UN ARTISTE (Shazam : liste « Concerts »)
   ===================================================================== */
export function renderArtistEvents(container, artistId) {
  const artist = (window.artists || []).find(a => String(a.id) === String(artistId));
  const list = upcomingEvents().filter(ev => artist && ev.artistId === artist.id);

  container.innerHTML = `
    <div class="ev-screen ev-list">
      <header class="ev-bar ev-bar-solid">
        <a class="ev-icon-btn" href="javascript:history.back()" aria-label="Retour">${ms('arrow_back')}</a>
        <h1>Événements</h1>
      </header>
      <div class="ev-rows">
        ${list.map(ev => {
          const d = eventDate(ev);
          const on = isSaved(ev.id);
          return `
          <div class="ev-row">
            <a class="ev-cover ev-row-img" href="#/event/${encodeURIComponent(ev.id)}">
              <img src="${eventImage(ev)}" alt="" loading="lazy"><span class="ev-cover-play ev-cover-play-sm">${ms('play_arrow', true)}</span>
            </a>
            <a class="ev-row-text" href="#/event/${encodeURIComponent(ev.id)}">
              <span class="ev-row-date">${ms('calendar_today')}${dayShortDate(d)}</span>
              <strong>${escapeHtml(eventName(ev))}</strong>
              <span class="ev-row-venue">${escapeHtml(ev.type === 'album' ? 'Sortie' : (ev.venue || ''))}</span>
              <span class="ev-row-city">${escapeHtml(ev.type === 'album' ? 'Sur Muzikly' : (ev.city || ''))}</span>
            </a>
            <div class="ev-row-actions">
              <button type="button" class="ev-icon-btn ev-row-more" data-share="${ev.id}" aria-label="Partager">${ms('more_vert')}</button>
              <button type="button" class="ev-row-save${on ? ' on' : ''}" data-save="${ev.id}" aria-label="${on ? 'Retirer' : 'Ajouter'}">${ms(on ? 'check_circle' : 'add_circle', true)}</button>
            </div>
          </div>`;
        }).join('')}
      </div>
      ${artist ? bandsintownSection(artist) : ''}
      <p class="ev-end">${list.length ? 'Aucun autre événement trouvé' : 'Aucun événement à venir pour cet artiste'}</p>
    </div>`;

  loadBandsintown();
  container.querySelectorAll('[data-save]').forEach(btn => btn.addEventListener('click', () => {
    toggleSaved(btn.dataset.save);
    renderArtistEvents(container, artistId);
  }));
  container.querySelectorAll('[data-share]').forEach(btn => btn.addEventListener('click', () => shareEvent(findEvent(btn.dataset.share))));
}

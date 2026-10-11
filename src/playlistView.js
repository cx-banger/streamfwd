/* =====================================================================
   ÉCRAN PLAYLIST — inspiré de l'écran « Titres » de Shazam
   Utilisé pour « Sons likés » (#/liked) et chaque playlist (#/playlist/<nom>).
   ===================================================================== */

import { escapeHtml, shareLink, showToast } from './ui.js';
import { MUZIKLY_GLYPH } from './events.js';

const ms = (name, fill = false) => `<span class="ms${fill ? ' ms-fill' : ''}">${name}</span>`;

const SORTS = [
  { key: 'recent', label: 'Ajoutés récemment' },
  { key: 'old', label: 'Ajoutés en premier' },
  { key: 'title', label: 'Titre (A → Z)' },
  { key: 'artist', label: 'Artiste (A → Z)' }
];

/* État de l'écran, conservé d'un affichage à l'autre */
const state = { key: null, artist: null, query: '', searching: false, sort: 'recent', grid: false };

const fmt = (opts) => new Intl.DateTimeFormat('fr-FR', opts);
const addedLabel = d => fmt({ day: 'numeric', month: 'short' }).format(d) + ', ' + fmt({ hour: '2-digit', minute: '2-digit' }).format(d);
const monthYear = d => fmt({ month: 'long', year: 'numeric' }).format(d);

/* Groupe d'un titre selon sa date d'ajout : comme Shazam */
function groupOf(t) {
  if (!t.addedAt) return 'Plus ancien';
  const d = new Date(t.addedAt);
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const lastWeek = new Date(startOfWeek); lastWeek.setDate(lastWeek.getDate() - 7);
  if (d >= startOfWeek) return 'Cette semaine';
  if (d >= lastWeek) return 'La semaine dernière';
  return monthYear(d);
}

function artistByName(name) {
  return (window.artists || []).find(a => a.name === name) || null;
}

/* Joue la liste affichée à partir de l'index donné */
function playFrom(list, idx) {
  window.playlist = list.map(t => ({ ...t }));
  window.loadAndPlay(idx);
  if (window.matchMedia('(max-width: 900px)').matches) window.openFullPlayer?.();
}

/**
 * @param {HTMLElement} container
 * @param {{ name: string, items: object[], liked?: boolean, backHref?: string,
 *           onRemove: (track) => void, onDelete?: () => void }} opts
 */
export function renderPlaylistScreen(container, opts) {
  const { name, items, liked = false, backHref = '#/playlists', onRemove, onDelete } = opts;
  if (state.key !== name) Object.assign(state, { key: name, artist: null, query: '', searching: false });

  // Filtres : artiste choisi + recherche
  const q = state.query.trim().toLowerCase();
  let list = items
    .map((t, i) => ({ ...t, _i: i }))
    .filter(t => !state.artist || t.artist === state.artist)
    .filter(t => !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));

  // Tri
  const byDate = (a, b) => (b.addedAt || 0) - (a.addedAt || 0) || b._i - a._i;
  if (state.sort === 'recent') list.sort(byDate);
  if (state.sort === 'old') list.sort((a, b) => -byDate(a, b));
  if (state.sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  if (state.sort === 'artist') list.sort((a, b) => a.artist.localeCompare(b.artist, 'fr') || a.title.localeCompare(b.title, 'fr'));

  // Puces : un artiste par puce (avec sa photo), dans l'ordre d'apparition
  const chipArtists = [...new Set(items.map(t => t.artist))];

  // Groupes par date (seulement pour les tris par date)
  const grouped = state.sort === 'recent' || state.sort === 'old';
  const sections = [];
  list.forEach((t, idx) => {
    const g = grouped ? groupOf(t) : '';
    if (!sections.length || sections[sections.length - 1].title !== g) sections.push({ title: g, rows: [] });
    sections[sections.length - 1].rows.push({ t, idx });
  });

  const count = list.length;
  const row = ({ t, idx }) => `
    <div class="pl-row" data-idx="${idx}" data-key="${escapeHtml(`${t.artist}::${t.title}`)}">
      <button type="button" class="pl-cover" data-play="${idx}" aria-label="Lire ${escapeHtml(t.title)}">
        ${t.thumb ? `<img src="${t.thumb}" alt="" loading="lazy">` : '<span class="pl-cover-empty">♪</span>'}
        <span class="pl-play">${ms('play_arrow', true)}</span>
      </button>
      <div class="pl-text">
        <button type="button" class="pl-title" data-play="${idx}">${escapeHtml(t.title)}</button>
        <span class="pl-artist">${escapeHtml(t.artist)}</span>
        ${t.addedAt ? `<span class="pl-date">${addedLabel(new Date(t.addedAt))}</span>` : ''}
        <span class="pl-foot">
          <span class="pl-badge">${MUZIKLY_GLYPH}Muzikly</span>
          <button type="button" class="pl-more" data-more="${idx}" aria-label="Options">${ms('more_vert')}</button>
        </span>
      </div>
    </div>`;

  container.innerHTML = `
    <div class="pl-screen${state.grid ? ' is-grid' : ''}">
      <header class="pl-bar">
        <a class="pl-icon" href="${backHref}" aria-label="Retour">${ms('arrow_back')}</a>
        <h2 class="pl-bar-title">${escapeHtml(name)}</h2>
        <button type="button" class="pl-icon" data-action="search" aria-label="Rechercher dans la liste">${ms('search')}</button>
        <button type="button" class="pl-icon" data-action="sort" aria-label="Trier">${ms('playlist_add_check')}</button>
      </header>

      <div class="pl-head">
        <h1 class="pl-h1">${escapeHtml(name)}</h1>
        <p class="pl-count">${count} trouvé${count > 1 ? 's' : ''}</p>
        <div class="pl-search"${state.searching ? '' : ' hidden'}>
          ${ms('search')}<input type="search" placeholder="Rechercher dans ${escapeHtml(name)}" value="${escapeHtml(state.query)}" aria-label="Rechercher dans la liste">
        </div>
        <div class="pl-chips">
          <button type="button" class="pl-chip pl-chip-view" data-action="view" aria-label="Changer l'affichage">
            ${ms(state.grid ? 'view_list' : 'apps')}${ms('expand_more')}
          </button>
          ${chipArtists.map(n => {
            const a = artistByName(n);
            return `<button type="button" class="pl-chip${state.artist === n ? ' on' : ''}" data-artist="${escapeHtml(n)}">
              ${a ? `<img src="${a.photo}" alt="" loading="lazy">` : ''}<span>${escapeHtml(n)}</span>
            </button>`;
          }).join('')}
        </div>
        ${!liked && onDelete ? `<button type="button" class="pl-delete" data-action="delete">${ms('delete')}Supprimer la playlist</button>` : ''}
      </div>

      <div class="pl-body">
        ${count ? sections.map(s => `
          <section class="pl-group">
            ${s.title ? `<h3 class="pl-group-title">${escapeHtml(s.title)}</h3>` : ''}
            ${s.rows.map(row).join('')}
          </section>`).join('') : `
          <p class="pl-empty">${items.length
            ? 'Aucun titre ne correspond.'
            : liked ? 'Aucun son liké pour l’instant. Touche le cœur ♡ d’un titre pour le retrouver ici.'
                    : 'Cette playlist est vide. Ajoute des titres depuis le lecteur (menu ⋮).'}</p>`}
      </div>

      <div class="pl-menu" hidden role="menu"></div>
    </div>`;

  const screen = container.querySelector('.pl-screen');
  const rerender = () => renderPlaylistScreen(container, opts);

  // Titre dans la barre quand on fait défiler (comme Shazam)
  const scroller = document.querySelector('.pages');
  const bar = screen.querySelector('.pl-bar');
  const onScroll = () => {
    if (!container.contains(bar)) return scroller.removeEventListener('scroll', onScroll);
    bar.classList.toggle('scrolled', scroller.scrollTop > 70);
  };
  scroller.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Lecture
  screen.querySelectorAll('[data-play]').forEach(el => el.addEventListener('click', () => playFrom(list, Number(el.dataset.play))));

  // Puces artistes
  screen.querySelectorAll('[data-artist]').forEach(el => el.addEventListener('click', () => {
    state.artist = state.artist === el.dataset.artist ? null : el.dataset.artist;
    rerender();
  }));

  // Recherche dans la liste
  const searchBox = screen.querySelector('.pl-search input');
  searchBox.addEventListener('input', () => {
    state.query = searchBox.value;
    rerender();
    const again = container.querySelector('.pl-search input');
    again.focus();
    again.setSelectionRange(again.value.length, again.value.length);
  });

  screen.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', (e) => {
    const action = el.dataset.action;
    if (action === 'search') {
      state.searching = !state.searching;
      if (!state.searching) state.query = '';
      rerender();
      if (state.searching) container.querySelector('.pl-search input')?.focus();
    }
    if (action === 'view') { state.grid = !state.grid; rerender(); }
    if (action === 'sort') { e.stopPropagation(); openMenu(el, SORTS.map(s => ({ label: s.label, icon: state.sort === s.key ? 'check' : '', run: () => { state.sort = s.key; rerender(); } }))); }
    if (action === 'delete' && onDelete) onDelete();
  }));

  // Menu ⋮ d'un titre
  screen.querySelectorAll('[data-more]').forEach(el => el.addEventListener('click', (e) => {
    e.stopPropagation();
    const t = list[Number(el.dataset.more)];
    const a = artistByName(t.artist);
    openMenu(el, [
      { label: 'Lire', icon: 'play_arrow', run: () => playFrom(list, Number(el.dataset.more)) },
      a ? { label: `Voir ${t.artist}`, icon: 'person', run: () => { location.hash = `#/artist/${a.id}`; } } : null,
      { label: 'Partager', icon: 'share', run: () => sharetrack(t) },
      { label: liked ? 'Retirer des Sons likés' : 'Retirer de la playlist', icon: liked ? 'heart_broken' : 'delete', run: () => onRemove(items[t._i]) }
    ].filter(Boolean));
  }));

  function openMenu(anchor, entries) {
    const menu = screen.querySelector('.pl-menu');
    menu.innerHTML = entries.map((m, i) => `<button type="button" role="menuitem" data-i="${i}">${m.icon ? ms(m.icon) : '<span class="ms"></span>'}<span>${escapeHtml(m.label)}</span></button>`).join('');
    const r = anchor.getBoundingClientRect();
    const s = screen.getBoundingClientRect();
    menu.hidden = false;
    const top = Math.min(r.bottom - s.top + 4, s.height - menu.offsetHeight - 8);
    menu.style.top = `${Math.max(8, top)}px`;
    menu.style.right = `${Math.max(8, s.right - r.right)}px`;
    menu.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { menu.hidden = true; entries[Number(b.dataset.i)].run(); }));
    setTimeout(() => document.addEventListener('click', () => { menu.hidden = true; }, { once: true }), 0);
  }

  window.updatePlayingState?.();
}

function sharetrack(t) {
  const a = artistByName(t.artist);
  const idx = a ? a.tracks.findIndex(x => x.title === t.title) : -1;
  const url = idx >= 0 ? `${location.origin}${location.pathname}#/track/${a.id}/${idx + 1}` : `${location.origin}${location.pathname}#/home`;
  shareLink({ title: `${t.title} - ${t.artist}`, text: `Écoute « ${t.title} » de ${t.artist} sur Muzikly`, url });
}

/* Petit rappel quand un titre est retiré */
export function removedToast(name) {
  showToast(`Retiré de « ${name} »`, { icon: 'delete' });
}

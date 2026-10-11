/* =====================================================================
   ESPACE ARTISTE — gestion des événements, des vidéos, et validation admin
   Données : tables Supabase « events » et « videos » (voir
   supabase/espace-artiste/3_evenements_videos.sql).
   Un artiste ne voit / modifie que les siens ; ce qu'il crée ou modifie
   passe « en attente » (imposé par Supabase) jusqu'à validation par l'admin.
   ===================================================================== */

import { escapeHtml, showToast } from './ui.js';

const ms = (name, fill = false) => `<span class="ms${fill ? ' ms-fill' : ''}">${name}</span>`;

const EVENT_TYPES = { concert: 'Concert', scene: 'Scène ouverte', album: 'Sortie (album / single)' };
const VIDEO_TYPES = { clip: 'Clip', teaser: 'Teaser', extrait: 'Extrait', live: 'Live' };
const STATUS = {
  pending: ['En attente', 'hourglass_top'],
  published: ['Publié', 'done'],
  rejected: ['Refusé', 'block']
};

/* Coordonnées de quelques villes, pour le filtre « À proximité » */
const CITIES = {
  paris: [48.8566, 2.3522], lyon: [45.764, 4.8357], marseille: [43.2965, 5.3698], lille: [50.6292, 3.0573],
  bordeaux: [44.8378, -0.5792], toulouse: [43.6047, 1.4442], nantes: [47.2184, -1.5536], strasbourg: [48.5734, 7.7521],
  rennes: [48.1173, -1.6778], montpellier: [43.6108, 3.8767], nice: [43.7102, 7.262], grenoble: [45.1885, 5.7245],
  rouen: [49.4432, 1.0999], reims: [49.2583, 4.0317], 'le havre': [49.4944, 0.1079], dijon: [47.322, 5.0415],
  bruxelles: [50.8503, 4.3517], liege: [50.6326, 5.5797], charleroi: [50.4108, 4.4446], geneve: [46.2044, 6.1432],
  lausanne: [46.5197, 6.6323], kinshasa: [-4.4419, 15.2663], kigali: [-1.9441, 30.0619], abidjan: [5.36, -4.0083],
  dakar: [14.7167, -17.4677], douala: [4.0511, 9.7679], yaounde: [3.848, 11.5021], montreal: [45.5019, -73.5674]
};
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const cityCoords = city => CITIES[norm(city)] || null;

const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';
const newId = (prefix, title) => `${prefix}-${slug(title)}-${Math.random().toString(36).slice(2, 6)}`;
const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = d => d ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d + 'T12:00:00')) : '';
const artistName = id => (window.artists || []).find(a => a.id === id)?.name || 'ConnexionBanger';
const statusBadge = st => { const [l, i] = STATUS[st] || STATUS.pending; return `<span class="as-status as-status-${st}">${ms(i)}${l}</span>`; };

/* Filtre « mes » éléments (artiste choisi, ou collectif si null) */
const mine = (query, artistId) => (artistId == null ? query.is('artist_id', null) : query.eq('artist_id', artistId));

function noteFor(ctx) {
  return ctx.account.is_admin
    ? '<p class="as-note">Admin : ce que tu enregistres est publié directement.</p>'
    : '<p class="as-note">Ce que tu crées ou modifies est envoyé pour <strong>validation</strong> : il apparaîtra dans l’app une fois approuvé par l’administrateur.</p>';
}

/* =====================================================================
   ÉVÉNEMENTS
   ===================================================================== */
export async function renderEventsTab(el, ctx, editing = null) {
  el.innerHTML = '<p class="as-muted">Chargement…</p>';
  const { data, error } = await mine(ctx.sb.from('events').select('*'), ctx.artistId).order('date', { ascending: true });
  if (error) { el.innerHTML = missingTables(error); return; }

  if (editing) return eventForm(el, ctx, editing === 'new' ? null : data.find(e => e.id === editing));

  el.innerHTML = `
    <div class="as-section-head">
      <h2 class="as-h2">Événements ${ctx.account.is_admin ? `· ${escapeHtml(artistName(ctx.artistId))}` : ''}</h2>
      <button type="button" class="pill-btn pill-btn-light" data-new>${ms('add')} Nouvel événement</button>
    </div>
    ${noteFor(ctx)}
    <div class="as-list">
      ${data.length ? data.map(ev => `
        <div class="as-row">
          <span class="as-row-date"><strong>${new Date(ev.date + 'T12:00:00').getDate()}</strong><small>${new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(ev.date + 'T12:00:00'))}</small></span>
          <span class="as-row-main">
            <strong>${escapeHtml(ev.title || ev.venue || EVENT_TYPES[ev.type])}</strong>
            <small>${EVENT_TYPES[ev.type]}${ev.city ? ` · ${escapeHtml(ev.city)}` : ''}${ev.time && ev.time !== '00:00' ? ` · ${escapeHtml(ev.time)}` : ''}</small>
          </span>
          ${statusBadge(ev.status)}
          <button type="button" class="icon-btn" data-edit="${escapeHtml(ev.id)}" aria-label="Modifier">${ms('edit')}</button>
          <button type="button" class="icon-btn" data-del="${escapeHtml(ev.id)}" aria-label="Supprimer">${ms('delete')}</button>
        </div>`).join('') : '<p class="as-muted">Aucun événement pour l’instant.</p>'}
    </div>`;

  el.querySelector('[data-new]').addEventListener('click', () => renderEventsTab(el, ctx, 'new'));
  el.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => renderEventsTab(el, ctx, b.dataset.edit)));
  el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Supprimer cet événement ?')) return;
    const { error: e } = await ctx.sb.from('events').delete().eq('id', b.dataset.del);
    if (e) return showToast('Suppression impossible', { icon: 'error' });
    showToast('Événement supprimé', { icon: 'delete' });
    window.refreshLiveData?.();
    renderEventsTab(el, ctx);
  }));
}

async function eventForm(el, ctx, ev) {
  const files = await ctx.listFolder();
  const images = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f.name));
  const v = ev || { type: 'concert', date: '', time: '20:00' };
  el.innerHTML = `
    <form class="as-card as-form" novalidate>
      <h2 class="as-h2">${ev ? 'Modifier l’événement' : 'Nouvel événement'}</h2>
      <div class="as-grid">
        <label>Type
          <select name="type">${Object.entries(EVENT_TYPES).map(([k, l]) => `<option value="${k}"${v.type === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
        </label>
        <label>Titre <small>(facultatif pour un concert)</small>
          <input name="title" value="${escapeHtml(v.title || '')}" placeholder="ex. Scène ouverte de Noël">
        </label>
        <label>Date *<input type="date" name="date" value="${escapeHtml(v.date || '')}" required></label>
        <label>Heure<input type="time" name="time" value="${escapeHtml(v.time || '')}"></label>
        <label class="as-place">Ville<input name="city" value="${escapeHtml(v.city || '')}" placeholder="ex. Paris"></label>
        <label class="as-place">Lieu<input name="venue" value="${escapeHtml(v.venue || '')}" placeholder="ex. Salle Pleyel"></label>
        <label class="as-place as-full">Adresse<input name="address" value="${escapeHtml(v.address || '')}" placeholder="ex. 252 rue du Faubourg Saint-Honoré"></label>
        <label class="as-place">Accès : arrêt le plus proche <small>(facultatif)</small>
          <input name="tr_stop" value="${escapeHtml(v.transit?.stop || '')}" placeholder="ex. Narbonne-Plage">
        </label>
        <label class="as-place">Transport
          <select name="tr_mode">${[['train', 'Train'], ['rer', 'RER'], ['metro', 'Métro'], ['tram', 'Tram'], ['bus', 'Bus']].map(([k, l]) => `<option value="${k}"${(v.transit?.mode || 'bus') === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
        </label>
        <label class="as-place">Lignes <small>(séparées par des virgules)</small>
          <input name="tr_lines" value="${escapeHtml((v.transit?.lines || []).join(', '))}" placeholder="ex. 166, 348D, 362C">
        </label>
        <label class="as-place">Marche depuis l’arrêt <small>(minutes)</small>
          <input type="number" name="tr_walk" min="0" max="60" value="${escapeHtml(String(v.transit?.walk ?? ''))}" placeholder="ex. 6">
        </label>
        <label class="as-full">Affiche
          <select name="image">
            <option value="">Affiche Muzikly par défaut</option>
            ${images.map(f => { const u = ctx.fileUrl(f.name); return `<option value="${escapeHtml(u)}"${v.image === u ? ' selected' : ''}>${escapeHtml(f.name)}</option>`; }).join('')}
          </select>
          <small>Envoie d’abord l’image dans l’onglet « Fichiers ».</small>
        </label>
        <label class="as-full">Lien billetterie / inscription <small>(facultatif)</small>
          <input type="url" name="ticket_url" value="${escapeHtml(v.ticket_url || '')}" placeholder="https://…">
        </label>
      </div>
      <p class="as-error" role="alert" hidden></p>
      <div class="as-form-actions">
        <button type="button" class="pill-btn" data-cancel>Annuler</button>
        <button type="submit" class="pill-btn pill-btn-light">${ctx.account.is_admin ? 'Publier' : 'Envoyer pour validation'}</button>
      </div>
    </form>`;

  const form = el.querySelector('form');
  const togglePlace = () => form.querySelectorAll('.as-place').forEach(l => { l.hidden = form.type.value === 'album'; });
  form.type.addEventListener('change', togglePlace);
  togglePlace();
  form.querySelector('[data-cancel]').addEventListener('click', () => renderEventsTab(el, ctx));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const err = form.querySelector('.as-error');
    const f = Object.fromEntries(new FormData(form));
    if (!f.date) { err.textContent = 'La date est obligatoire.'; err.hidden = false; return; }
    if (f.type !== 'album' && !f.city) { err.textContent = 'Indique la ville.'; err.hidden = false; return; }
    if (f.type !== 'concert' && !f.title) { err.textContent = 'Donne un titre à cet événement.'; err.hidden = false; return; }
    const isAlbum = f.type === 'album';
    const coords = isAlbum ? null : cityCoords(f.city);
    const row = {
      type: f.type, title: f.title || null, date: f.date, time: f.time || null,
      city: isAlbum ? null : f.city || null, venue: isAlbum ? null : f.venue || null, address: isAlbum ? null : f.address || null,
      lat: coords ? coords[0] : null, lng: coords ? coords[1] : null,
      image: f.image || null, ticket_url: f.ticket_url || null,
      artist_id: ctx.artistId
    };
    // Accès en transports (colonne « transit », voir supabase/espace-artiste/4_acces_transports.sql)
    const lines = (f.tr_lines || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 6);
    if (!isAlbum && (f.tr_stop || lines.length)) {
      row.transit = { stop: f.tr_stop.trim() || null, mode: f.tr_mode, lines, walk: f.tr_walk ? Number(f.tr_walk) : null };
    } else if (ev && 'transit' in ev) {
      row.transit = null;
    }
    if (ctx.account.is_admin) row.status = 'published';
    const q = ev
      ? ctx.sb.from('events').update(row).eq('id', ev.id)
      : ctx.sb.from('events').insert({ id: newId('ev', f.title || artistName(ctx.artistId)), ...row });
    const { error } = await q;
    if (error) { err.textContent = 'Enregistrement impossible : ' + error.message; err.hidden = false; return; }
    showToast(ctx.account.is_admin ? 'Événement publié' : 'Envoyé pour validation', { icon: ctx.account.is_admin ? 'done' : 'hourglass_top' });
    window.refreshLiveData?.();
    renderEventsTab(el, ctx);
  });
}

/* =====================================================================
   VIDÉOS
   ===================================================================== */
export async function renderVideosTab(el, ctx, editing = null) {
  el.innerHTML = '<p class="as-muted">Chargement…</p>';
  const { data, error } = await mine(ctx.sb.from('videos').select('*'), ctx.artistId).order('date', { ascending: false });
  if (error) { el.innerHTML = missingTables(error); return; }

  if (editing) return videoForm(el, ctx, editing === 'new' ? null : data.find(v => v.id === editing));

  el.innerHTML = `
    <div class="as-section-head">
      <h2 class="as-h2">Vidéos ${ctx.account.is_admin ? `· ${escapeHtml(artistName(ctx.artistId))}` : ''}</h2>
      <button type="button" class="pill-btn pill-btn-light" data-new>${ms('add')} Nouvelle vidéo</button>
    </div>
    ${noteFor(ctx)}
    <div class="as-list">
      ${data.length ? data.map(v => `
        <div class="as-row">
          <span class="as-row-icon">${ms(/youtu/.test(v.url) ? 'smart_display' : 'movie')}</span>
          <span class="as-row-main">
            <strong>${escapeHtml(v.title)}</strong>
            <small>${VIDEO_TYPES[v.type]}${v.date ? ` · ${dateLabel(v.date)}` : ''}</small>
          </span>
          ${statusBadge(v.status)}
          <button type="button" class="icon-btn" data-edit="${escapeHtml(v.id)}" aria-label="Modifier">${ms('edit')}</button>
          <button type="button" class="icon-btn" data-del="${escapeHtml(v.id)}" aria-label="Supprimer">${ms('delete')}</button>
        </div>`).join('') : '<p class="as-muted">Aucune vidéo pour l’instant.</p>'}
    </div>`;

  el.querySelector('[data-new]').addEventListener('click', () => renderVideosTab(el, ctx, 'new'));
  el.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => renderVideosTab(el, ctx, b.dataset.edit)));
  el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Supprimer cette vidéo de la page Vidéos ? (le fichier reste dans « Fichiers »)')) return;
    const { error: e } = await ctx.sb.from('videos').delete().eq('id', b.dataset.del);
    if (e) return showToast('Suppression impossible', { icon: 'error' });
    showToast('Vidéo supprimée', { icon: 'delete' });
    window.refreshLiveData?.();
    renderVideosTab(el, ctx);
  }));
}

async function videoForm(el, ctx, vd) {
  const [files, evRes] = await Promise.all([
    ctx.listFolder(),
    mine(ctx.sb.from('events').select('id, title, type, date, venue'), ctx.artistId).order('date')
  ]);
  const clips = files.filter(f => /\.(mp4|webm|mov)$/i.test(f.name));
  const images = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f.name));
  const events = evRes.data || [];
  const tracks = (window.artists || []).find(a => a.id === ctx.artistId)?.tracks || [];
  const v = vd || { type: 'clip', date: today() };
  const isYt = vd && /youtu/.test(vd.url);
  const fileUrls = clips.map(f => ctx.fileUrl(f.name));

  el.innerHTML = `
    <form class="as-card as-form" novalidate>
      <h2 class="as-h2">${vd ? 'Modifier la vidéo' : 'Nouvelle vidéo'}</h2>
      <div class="as-grid">
        <label>Type
          <select name="type">${Object.entries(VIDEO_TYPES).map(([k, l]) => `<option value="${k}"${v.type === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
        </label>
        <label>Titre *<input name="title" value="${escapeHtml(v.title || '')}" placeholder="ex. Sans Effet (clip officiel)" required></label>
        <label class="as-full">Vidéo *
          <select name="source">
            <option value="youtube"${isYt || !clips.length ? ' selected' : ''}>Lien YouTube</option>
            ${clips.map((f, i) => `<option value="${escapeHtml(fileUrls[i])}"${v.url === fileUrls[i] ? ' selected' : ''}>Fichier : ${escapeHtml(f.name)}</option>`).join('')}
          </select>
          <small>${clips.length ? 'Choisis un fichier envoyé dans « Fichiers », ou un lien YouTube.' : 'Colle un lien YouTube, ou envoie d’abord ta vidéo (MP4) dans « Fichiers ».'}</small>
        </label>
        <label class="as-full as-yt">Lien YouTube<input type="url" name="youtube" value="${escapeHtml(isYt ? v.url : '')}" placeholder="https://www.youtube.com/watch?v=…"></label>
        <label>Date de publication<input type="date" name="date" value="${escapeHtml(v.date || today())}"></label>
        <label>Titre associé <small>(facultatif)</small>
          <select name="track_no"><option value="">Aucun</option>${tracks.map((t, i) => `<option value="${i + 1}"${v.track_no === i + 1 ? ' selected' : ''}>${escapeHtml(t.title)}</option>`).join('')}</select>
        </label>
        <label>Événement associé <small>(pour un teaser)</small>
          <select name="event_id"><option value="">Aucun</option>${events.map(e => `<option value="${escapeHtml(e.id)}"${v.event_id === e.id ? ' selected' : ''}>${escapeHtml(e.title || e.venue || EVENT_TYPES[e.type])} · ${dateLabel(e.date)}</option>`).join('')}</select>
        </label>
        <label>Image d’aperçu <small>(facultatif)</small>
          <select name="poster"><option value="">Automatique</option>${images.map(f => { const u = ctx.fileUrl(f.name); return `<option value="${escapeHtml(u)}"${v.poster === u ? ' selected' : ''}>${escapeHtml(f.name)}</option>`; }).join('')}</select>
        </label>
      </div>
      <p class="as-error" role="alert" hidden></p>
      <div class="as-form-actions">
        <button type="button" class="pill-btn" data-cancel>Annuler</button>
        <button type="submit" class="pill-btn pill-btn-light">${ctx.account.is_admin ? 'Publier' : 'Envoyer pour validation'}</button>
      </div>
    </form>`;

  const form = el.querySelector('form');
  const toggleYt = () => { form.querySelector('.as-yt').hidden = form.source.value !== 'youtube'; };
  form.source.addEventListener('change', toggleYt);
  toggleYt();
  form.querySelector('[data-cancel]').addEventListener('click', () => renderVideosTab(el, ctx));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const err = form.querySelector('.as-error');
    const f = Object.fromEntries(new FormData(form));
    const fail = m => { err.textContent = m; err.hidden = false; };
    if (!f.title) return fail('Donne un titre à la vidéo.');
    const url = f.source === 'youtube' ? f.youtube.trim() : f.source;
    if (!url) return fail('Colle le lien YouTube ou choisis un fichier vidéo.');
    if (f.source === 'youtube' && !/(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}/.test(url)) return fail('Ce lien YouTube n’est pas reconnu.');
    const row = {
      type: f.type, title: f.title, url, date: f.date || today(),
      track_no: f.track_no ? Number(f.track_no) : null, event_id: f.event_id || null,
      poster: f.poster || null, artist_id: ctx.artistId
    };
    if (ctx.account.is_admin) row.status = 'published';
    const q = vd
      ? ctx.sb.from('videos').update(row).eq('id', vd.id)
      : ctx.sb.from('videos').insert({ id: newId('vd', f.title), ...row });
    const { error } = await q;
    if (error) return fail('Enregistrement impossible : ' + error.message);
    showToast(ctx.account.is_admin ? 'Vidéo publiée' : 'Envoyée pour validation', { icon: ctx.account.is_admin ? 'done' : 'hourglass_top' });
    window.refreshLiveData?.();
    renderVideosTab(el, ctx);
  });
}

/* =====================================================================
   VALIDATION (admin)
   ===================================================================== */
export async function renderReviewTab(el, ctx) {
  el.innerHTML = '<p class="as-muted">Chargement…</p>';
  const [ev, vd] = await Promise.all([
    ctx.sb.from('events').select('*').eq('status', 'pending').order('updated_at'),
    ctx.sb.from('videos').select('*').eq('status', 'pending').order('updated_at')
  ]);
  if (ev.error || vd.error) { el.innerHTML = missingTables(ev.error || vd.error); return; }
  const items = [
    ...ev.data.map(e => ({ table: 'events', id: e.id, kind: EVENT_TYPES[e.type], who: artistName(e.artist_id),
      title: e.title || e.venue || EVENT_TYPES[e.type],
      detail: [dateLabel(e.date), e.time && e.time !== '00:00' ? e.time : '', e.venue, e.city].filter(Boolean).join(' · '),
      link: e.ticket_url, image: e.image })),
    ...vd.data.map(v => ({ table: 'videos', id: v.id, kind: VIDEO_TYPES[v.type], who: artistName(v.artist_id),
      title: v.title, detail: dateLabel(v.date), link: v.url, image: v.poster }))
  ];

  el.innerHTML = `
    <h2 class="as-h2">À valider ${items.length ? `<span class="as-count">${items.length}</span>` : ''}</h2>
    <div class="as-list">
      ${items.length ? items.map(it => `
        <div class="as-row as-review">
          ${it.image ? `<img class="as-review-img" src="${escapeHtml(it.image)}" alt="">` : `<span class="as-row-icon">${ms(it.table === 'events' ? 'event' : 'movie')}</span>`}
          <span class="as-row-main">
            <strong>${escapeHtml(it.title)}</strong>
            <small>${escapeHtml(it.who)} · ${escapeHtml(it.kind)}${it.detail ? ` · ${escapeHtml(it.detail)}` : ''}</small>
            ${it.link ? `<a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">${escapeHtml(it.link)}</a>` : ''}
          </span>
          <button type="button" class="pill-btn" data-act="rejected" data-table="${it.table}" data-id="${escapeHtml(it.id)}">${ms('block')} Refuser</button>
          <button type="button" class="pill-btn pill-btn-light" data-act="published" data-table="${it.table}" data-id="${escapeHtml(it.id)}">${ms('done')} Publier</button>
        </div>`).join('') : '<p class="as-muted">Rien à valider pour le moment. 🎉</p>'}
    </div>`;

  el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', async () => {
    const { error } = await ctx.sb.from(b.dataset.table).update({ status: b.dataset.act }).eq('id', b.dataset.id);
    if (error) return showToast('Action impossible', { icon: 'error' });
    showToast(b.dataset.act === 'published' ? 'Publié' : 'Refusé', { icon: b.dataset.act === 'published' ? 'done' : 'block' });
    window.refreshLiveData?.();
    renderReviewTab(el, ctx);
  }));
}

function missingTables(error) {
  const missing = /does not exist|schema cache|42P01/.test(error?.message || '') || error?.code === '42P01';
  return missing
    ? '<p class="as-muted">Cette fonction n’est pas encore activée : l’administrateur doit exécuter le script <code>3_evenements_videos.sql</code> dans Supabase.</p>'
    : `<p class="as-muted">Chargement impossible : ${escapeHtml(error?.message || 'erreur inconnue')}</p>`;
}

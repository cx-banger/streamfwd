/* =====================================================================
   ESPACE ARTISTE (#/upload) — dépôt de fichiers par les artistes
   Connexion avec un vrai compte Supabase (e-mail + mot de passe).
   Chaque artiste ne peut écrire que dans son dossier du bucket « sons » :
   c'est Supabase qui l'impose (voir supabase/espace-artiste/*.sql).
   Seule la clé publique « anon » est utilisée ici, jamais la clé service_role.
   ===================================================================== */

import { sons, SONS_URL, SONS_ANON_KEY } from './sonsClient.js';
import { escapeHtml, showToast } from './ui.js';
import { renderEventsTab, renderVideosTab, renderReviewTab } from './artistManage.js';

const BUCKET = 'sons';
const MAX_SIZE = 50 * 1024 * 1024;
/* Connexion par identifiant : Supabase exige un e-mail, l'identifiant est donc
   converti en adresse interne (jamais affichée, aucun e-mail n'y est envoyé).
   Ex. : « nan » → nan@artistes.muzikly.app */
const LOGIN_DOMAIN = 'artistes.muzikly.app';
const toLoginEmail = id => id.includes('@') ? id : `${id.toLowerCase()}@${LOGIN_DOMAIN}`;
const toIdentifier = email => String(email || '').replace(`@${LOGIN_DOMAIN}`, '');

const ALLOWED = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov'];

let account = null;       // { folder, display_name, is_admin }
let adminFolder = null;   // dossier choisi par l'admin
let tab = 'files';        // onglet ouvert

const ms = (name, fill = false) => `<span class="ms${fill ? ' ms-fill' : ''}">${name}</span>`;

async function getClient() { return sons(); }

const sizeLabel = b => b > 1048576 ? `${(b / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(b / 1024))} Ko`;
const cleanName = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
const folderOf = () => (account?.is_admin ? adminFolder : account?.folder);

/* ---------- Rendu ---------- */
export async function renderArtistSpace(container) {
  const sb = await getClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return renderLogin(container);

  if (!account) {
    const { data, error } = await sb.from('artist_accounts').select('folder, display_name, is_admin').eq('user_id', session.user.id).maybeSingle();
    if (error || !data) {
      container.innerHTML = shell(`
        <div class="as-card as-center">
          ${ms('person_off')}
          <h2>Compte non relié</h2>
          <p>Ton identifiant <strong>${escapeHtml(toIdentifier(session.user.email))}</strong> existe, mais il n'est relié à aucun dossier d'artiste. Demande à l'administrateur de l'ajouter.</p>
          <button type="button" class="pill-btn" data-logout>Se déconnecter</button>
        </div>`);
      bindLogout(container);
      return;
    }
    account = data;
    if (account.is_admin && !adminFolder) adminFolder = 'artiste1';
  }
  renderUpload(container, session);
}

function shell(inner) {
  return `<div class="as-page"><h1 class="page-title">Espace artiste</h1>${inner}</div>`;
}

function renderLogin(container, message = '') {
  container.innerHTML = shell(`
    <form class="as-card as-login" novalidate>
      <p class="as-lead">Connecte-toi avec l'identifiant et le mot de passe que t'a donnés ConnexionBanger pour envoyer tes sons et tes pochettes.</p>
      <label>Identifiant<input type="text" name="login" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="ex. nan" required></label>
      <label>Mot de passe<input type="password" name="password" autocomplete="current-password" required></label>
      <p class="as-error" role="alert"${message ? '' : ' hidden'}>${escapeHtml(message)}</p>
      <button type="submit" class="pill-btn pill-btn-light as-submit">Se connecter</button>
      <p class="as-hint">Mot de passe oublié ? Demande à l'administrateur de ConnexionBanger de le réinitialiser.</p>
    </form>`);

  const form = container.querySelector('form');
  const err = form.querySelector('.as-error');
  const fail = msg => { err.textContent = msg; err.hidden = false; };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const login = form.login.value.trim();
    const password = form.password.value;
    if (!login || !password) return fail('Renseigne ton identifiant et ton mot de passe.');
    const btn = form.querySelector('.as-submit');
    btn.disabled = true; btn.textContent = 'Connexion…';
    const sb = await getClient();
    const { error } = await sb.auth.signInWithPassword({ email: toLoginEmail(login), password });
    btn.disabled = false; btn.textContent = 'Se connecter';
    if (error) return fail(error.message === 'Invalid login credentials' ? 'Identifiant ou mot de passe incorrect.' : 'Connexion impossible pour le moment.');
    account = null;
    renderArtistSpace(container);
  });
}

function renderUpload(container, session) {
  const folder = folderOf();
  container.innerHTML = shell(`
    <div class="as-card as-user">
      <span class="as-avatar">${escapeHtml((account.display_name || '?').charAt(0).toUpperCase())}</span>
      <span class="as-who"><strong>${escapeHtml(account.display_name)}</strong><small>${escapeHtml(toIdentifier(session.user.email))}</small></span>
      <button type="button" class="pill-btn" data-logout>${ms('logout')} Déconnexion</button>
    </div>

    <nav class="as-tabs" role="tablist">
      ${[['files', 'cloud_upload', 'Fichiers'], ['events', 'event', 'Événements'], ['videos', 'videocam', 'Vidéos']]
        .concat(account.is_admin ? [['review', 'fact_check', 'Validation']] : [])
        .map(([k, i, l]) => `<button type="button" role="tab" class="${tab === k ? 'on' : ''}" data-tab="${k}" aria-selected="${tab === k}">${ms(i)}${l}</button>`).join('')}
    </nav>

    ${account.is_admin && tab !== 'review' ? `
    <label class="as-admin">Artiste (admin)
      <select data-folder>${[['admin', 'ConnexionBanger (collectif)'], ...Array.from({ length: 10 }, (_, i) => [`artiste${i + 1}`, `${(window.artists || [])[i]?.name || ''} · artiste${i + 1}`])].map(([f, l]) => `<option value="${f}"${f === folder ? ' selected' : ''}>${escapeHtml(l)}</option>`).join('')}</select>
    </label>` : ''}

    <div class="as-tab">${tab === 'files' ? `
    <label class="as-drop" tabindex="0">
      <input type="file" multiple accept=".${ALLOWED.join(',.')}" hidden>
      ${ms('cloud_upload')}
      <strong>Glisse tes fichiers ici</strong>
      <span>ou touche pour choisir · sons (MP3, WAV…), images (JPG, PNG), vidéos (MP4) · 50 Mo max</span>
      <small>Destination : <code>${BUCKET}/${escapeHtml(folder)}/</code></small>
    </label>

    <div class="as-queue"></div>

    <h2 class="as-h2">Tes fichiers</h2>
    <div class="as-files"><p class="as-muted">Chargement…</p></div>` : ''}</div>`);

  bindLogout(container);
  container.querySelector('[data-folder]')?.addEventListener('change', e => { adminFolder = e.target.value; renderUpload(container, session); });
  container.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; renderUpload(container, session); }));

  if (tab !== 'files') {
    const ctx = {
      sb: sons(), account, folder,
      artistId: folder.startsWith('artiste') ? Number(folder.slice(7)) : null,
      fileUrl: name => `${SONS_URL}/storage/v1/object/public/${BUCKET}/${folder}/${encodeURIComponent(name)}`,
      listFolder: async () => ((await sons().storage.from(BUCKET).list(folder, { limit: 200 })).data || []).filter(f => f.id),
      rerender: () => renderUpload(container, session)
    };
    const el = container.querySelector('.as-tab');
    if (tab === 'events') renderEventsTab(el, ctx);
    if (tab === 'videos') renderVideosTab(el, ctx);
    if (tab === 'review') renderReviewTab(el, ctx);
    return;
  }

  const drop = container.querySelector('.as-drop');
  const input = drop.querySelector('input');
  input.addEventListener('change', () => { handleFiles([...input.files], container, session); input.value = ''; });
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => handleFiles([...e.dataTransfer.files], container, session));

  listFiles(container);
}

function bindLogout(container) {
  container.querySelector('[data-logout]')?.addEventListener('click', async () => {
    const sb = await getClient();
    await sb.auth.signOut();
    account = null; adminFolder = null; tab = 'files';
    renderLogin(container);
    showToast('Déconnecté', { icon: 'logout' });
  });
}

/* ---------- Envoi (avec barre de progression) ---------- */
async function handleFiles(files, container, session) {
  const queue = container.querySelector('.as-queue');
  const folder = folderOf();
  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase();
    const row = document.createElement('div');
    row.className = 'as-item';
    row.innerHTML = `<span class="as-item-name">${escapeHtml(file.name)}</span><span class="as-item-size">${sizeLabel(file.size)}</span><span class="as-bar"><span></span></span><span class="as-item-state"></span>`;
    queue.prepend(row);
    const state = row.querySelector('.as-item-state');
    const setState = (txt, cls) => { state.textContent = txt; row.classList.add(cls); };

    if (!ALLOWED.includes(ext)) { setState('Format non accepté', 'err'); continue; }
    if (file.size > MAX_SIZE) { setState('Plus de 50 Mo', 'err'); continue; }

    try {
      await uploadWithProgress(file, `${folder}/${cleanName(file.name)}`, session, pct => {
        row.querySelector('.as-bar span').style.width = `${pct}%`;
      });
      setState('Envoyé', 'ok');
    } catch (e) {
      setState(e.message, 'err');
    }
  }
  listFiles(container);
}

async function uploadWithProgress(file, path, session, onProgress) {
  const sb = await getClient();
  const { data: { session: fresh } } = await sb.auth.getSession();
  const token = (fresh || session).access_token;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SONS_URL}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SONS_ANON_KEY);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = 'Échec de l’envoi';
      try {
        const body = JSON.parse(xhr.responseText);
        if (/exists|Duplicate/i.test(body.message || body.error || '')) msg = 'Un fichier porte déjà ce nom';
        else if (xhr.status === 403 || /policy|security/i.test(body.message || '')) msg = 'Dossier non autorisé';
      } catch {}
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error('Connexion perdue'));
    xhr.send(file);
  });
}

/* ---------- Liste des fichiers du dossier ---------- */
async function listFiles(container) {
  const box = container.querySelector('.as-files');
  if (!box) return;
  const sb = await getClient();
  const folder = folderOf();
  const { data, error } = await sb.storage.from(BUCKET).list(folder, { limit: 200, sortBy: { column: 'name', order: 'asc' } });
  if (error) { box.innerHTML = '<p class="as-muted">Impossible de lister les fichiers pour le moment.</p>'; return; }
  const files = (data || []).filter(f => f.id && f.name !== '.emptyFolderPlaceholder');
  if (!files.length) { box.innerHTML = '<p class="as-muted">Aucun fichier dans ce dossier pour l’instant.</p>'; return; }
  box.innerHTML = files.map(f => {
    const url = `${SONS_URL}/storage/v1/object/public/${BUCKET}/${folder}/${encodeURIComponent(f.name)}`;
    const isAudio = /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.name);
    const isVideo = /\.(mp4|webm|mov)$/i.test(f.name);
    return `
      <div class="as-file">
        ${ms(isAudio ? 'music_note' : isVideo ? 'movie' : 'image')}
        <a class="as-file-name" href="${url}" target="_blank" rel="noopener">${escapeHtml(f.name)}</a>
        <span class="as-item-size">${f.metadata?.size ? sizeLabel(f.metadata.size) : ''}</span>
        <button type="button" class="icon-btn" data-delete="${escapeHtml(f.name)}" aria-label="Supprimer ${escapeHtml(f.name)}">${ms('delete')}</button>
      </div>`;
  }).join('');
  box.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm(`Supprimer « ${b.dataset.delete} » ? Le son ne sera plus lisible dans l'app.`)) return;
    const { error: delErr } = await sb.storage.from(BUCKET).remove([`${folder}/${b.dataset.delete}`]);
    if (delErr) return showToast('Suppression impossible', { icon: 'error' });
    showToast('Fichier supprimé', { icon: 'delete' });
    listFiles(container);
  }));
}

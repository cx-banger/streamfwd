/* ========= Utilitaires d'interface (toasts, échappement HTML, partage) ========= */

/* Notification discrète en bas de l'écran, remplace les alert() */
export function showToast(message, { icon = 'fa-circle-check', duration = 2500 } = {}) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fas ${icon}"></i><span></span>`;
  toast.querySelector('span').textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

/* Échappe un texte avant de l'insérer via innerHTML */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Partage natif sur mobile, sinon copie du lien dans le presse-papiers */
export async function shareLink({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('Lien copié dans le presse-papiers', { icon: 'fa-link' });
  } catch {
    showToast('Impossible de copier le lien', { icon: 'fa-circle-exclamation' });
  }
}

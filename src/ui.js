/* ========= Utilitaires d'interface (toasts, échappement HTML, partage) ========= */

/* Notification discrète en bas de l'écran, remplace les alert() */
export function showToast(message, { icon = 'check_circle', duration = 2500 } = {}) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="ms ms-fill">${icon}</span><span></span>`;
  toast.querySelector('span:last-child').textContent = message;
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
    showToast('Lien copié dans le presse-papiers', { icon: 'link' });
  } catch {
    showToast('Impossible de copier le lien', { icon: 'error' });
  }
}

/* Couleur dominante d'une pochette, assombrie pour rester lisible avec du texte blanc.
   Les couleurs vives comptent davantage que les gris, comme sur Apple Music / Spotify. */
const coverColorCache = new Map();

export function coverColor(url) {
  if (!url) return Promise.resolve(null);
  if (coverColorCache.has(url)) return coverColorCache.get(url);

  const promise = new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let r = 0, g = 0, b = 0, total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const [pr, pg, pb] = [data[i], data[i + 1], data[i + 2]];
          const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
          const light = (max + min) / 510;
          const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
          // Poids : couleurs saturées favorisées, pixels presque noirs ou blancs ignorés
          const w = 0.05 + sat * sat * (light > 0.08 && light < 0.92 ? 1 : 0.1);
          r += pr * w; g += pg * w; b += pb * w; total += w;
        }
        resolve(toReadable(r / total, g / total, b / total));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
  coverColorCache.set(url, promise);
  return promise;
}

/* Ajuste la luminosité (HSL) pour un fond sombre et coloré */
function toReadable(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  const sat = Math.min(0.7, s);
  const light = Math.min(0.38, Math.max(0.24, l));
  return `hsl(${Math.round(h * 360)} ${Math.round(sat * 100)}% ${Math.round(light * 100)}%)`;
}

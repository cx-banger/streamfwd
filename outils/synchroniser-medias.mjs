/* =====================================================================
   Copie les sons (MP3) et les vidéos « canvas » de Supabase vers le dépôt
   cx-muzik, servi par GitHub Pages (bande passante bien plus large que
   l'offre gratuite de Supabase).

   Utilisation (Node 18 ou plus) :
     git clone https://github.com/CX-Banger/cx-muzik.git
     node outils/synchroniser-medias.mjs ../cx-muzik
     cd ../cx-muzik && git add media && git commit -m "Médias" && git push

   - Ne télécharge que ce qui manque (ou a changé de taille).
   - Les fichiers vont dans <cx-muzik>/media/sons/artisteN/sonK.mp3
     et <cx-muzik>/media/canvas/artisteN/K.mp4
   - Tant qu'un fichier n'est pas copié, l'app le lit sur Supabase (repli automatique).
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';

const SUPABASE = 'https://hrzmagjjobctkfxayokt.supabase.co';
const client = fs.readFileSync(new URL('../src/sonsClient.js', import.meta.url), 'utf8');
const KEY = client.match(/SONS_ANON_KEY = '([^']+)'/)[1];      // clé publique uniquement
const ARTISTS = 10;

const dest = process.argv[2];
if (!dest || !fs.existsSync(path.join(dest, '.git'))) {
  console.error('Indique le dossier du dépôt cx-muzik cloné, ex. : node outils/synchroniser-medias.mjs ../cx-muzik');
  process.exit(1);
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function listSons(n) {
  const r = await fetch(`${SUPABASE}/storage/v1/object/list/sons`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: `artiste${n}`, limit: 1000 })
  });
  const files = await r.json();
  return files.filter(f => /^son\d+\.mp3$/.test(f.name)).map(f => ({ name: f.name, size: f.metadata?.size || 0 }));
}

async function download(url, file, expected) {
  if (fs.existsSync(file) && (!expected || fs.statSync(file).size === expected)) return 'déjà là';
  const r = await fetch(url);
  if (!r.ok) return `absent (${r.status})`;
  const buf = Buffer.from(await r.arrayBuffer());
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  return `copié (${(buf.length / 1e6).toFixed(1)} Mo)`;
}

let copied = 0, total = 0;
for (let n = 1; n <= ARTISTS; n++) {
  const sons = await listSons(n);
  for (const s of sons) {
    const k = s.name.match(/\d+/)[0];
    const res = await download(`${SUPABASE}/storage/v1/object/public/sons/artiste${n}/${s.name}`,
      path.join(dest, 'media/sons', `artiste${n}`, s.name), s.size);
    total++; if (res.startsWith('copié')) copied++;
    console.log(`sons/artiste${n}/${s.name} : ${res}`);
    // Vidéo canvas du même titre (le dossier canvas ne se liste pas : on teste l'adresse)
    const cUrl = `${SUPABASE}/storage/v1/object/public/canvas/artiste${n}/${k}.mp4`;
    const head = await fetch(cUrl, { method: 'HEAD' });
    if (head.ok) {
      const size = Number(head.headers.get('content-length')) || 0;
      const r2 = await download(cUrl, path.join(dest, 'media/canvas', `artiste${n}`, `${k}.mp4`), size);
      total++; if (r2.startsWith('copié')) copied++;
      console.log(`canvas/artiste${n}/${k}.mp4 : ${r2}`);
    }
  }
}
console.log(`\nTerminé : ${copied} fichier(s) copié(s) sur ${total}.`);

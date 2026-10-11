# Muzikly

L'appli d'écoute des artistes de ConnexionBanger : gospel, worship et rap chrétien.

**https://cx-banger.github.io/streamfwd/outils/apercu-mobile.html**

<a href="https://cx-banger.github.io/streamfwd/"><img src=".github/readme/hero.jpg" alt="Muzikly" width="100%"></a>

Ça s'ouvre dans le navigateur, sur téléphone ou sur ordinateur. Pas d'appli à installer, pas de compte à créer. On y trouve tous les titres de NΛN, Synaï, Elihem, Sara, Eilynn, Melohim, Tiim, Math, Raph et Paguiel, avec les paroles quand elles existent, les vidéos, et les prochains concerts et scènes ouvertes.

Les likes et les playlists sont gardés sur ton téléphone, rien n'est envoyé nulle part.

Sur iPhone, pour l'avoir comme une vraie appli : Safari, bouton Partager, « Sur l'écran d'accueil ». Sur Android : menu ⋮ de Chrome, « Ajouter à l'écran d'accueil ».

## Aperçu

<img src=".github/readme/ecouter.jpg" alt="Explorer, page artiste et playlists" width="100%">

<img src=".github/readme/evenements.jpg" alt="Événements et fiche d'un événement" width="100%">

<img src=".github/readme/desktop.jpg" alt="Muzikly sur ordinateur" width="100%">

La page Vidéos marche comme Reels ou TikTok : on fait glisser, la vidéo suivante démarre avec le son, et « Écouter » ouvre le titre complet dans le lecteur.

La page Événements liste les dates de tout le monde. Le filtre « À proximité » demande ta position et garde ce qui est à moins de 100 km.

## Pour les artistes

<img src=".github/readme/artistes.jpg" alt="Espace artiste" width="100%">

Chaque artiste a un Espace artiste (menu, puis « Espace artiste »), avec l'identifiant et le mot de passe donnés par ConnexionBanger. De là, tu peux envoyer tes sons, pochettes et vidéos (50 Mo max par fichier), et publier tes événements et tes vidéos.

Tu ne peux toucher qu'à ton propre contenu, et rien n'apparaît dans l'appli avant que l'admin l'ait validé. Mot de passe oublié : demande à l'admin.

Pas encore sur Muzikly ? Contacte ConnexionBanger.

L'admin valide les publications depuis l'onglet « Validation ». La création des comptes et les règles de sécurité sont expliquées dans [supabase/espace-artiste/LISEZ-MOI.md](supabase/espace-artiste/LISEZ-MOI.md).

## Développement

Il faut Node.js 18 ou plus.

```bash
npm ci
npm run dev     # http://localhost:5173/streamfwd/
```

Le site est servi par GitHub Pages depuis `docs/`. Pour publier :

```bash
npm run build   # régénère docs/ entièrement, ne pas le modifier à la main
git add -A && git commit -m "…" && git push
```

Tout ce qui est dans `public/` est copié tel quel dans le site. C'est le cas de l'outil d'aperçu sur plusieurs téléphones : [outils/apercu-mobile.html](https://cx-banger.github.io/streamfwd/outils/apercu-mobile.html).

Le code est en JS sans framework, avec Vite. Les points d'entrée :

- `src/script.js` : catalogue, navigation (`#/artist/1`, `#/track/1/3`, `#/videos`…), pages
- `src/player.js` : mini-lecteur et lecteur plein écran
- `src/events.js`, `src/videos.js` : Événements et Vidéos, avec des données de secours dans `eventsData.js` et `videosData.js`
- `src/artistSpace.js`, `src/artistManage.js` : Espace artiste
- `src/liveData.js`, `src/sonsClient.js` : lecture des données Supabase

Pour ajouter un titre : l'artiste envoie le MP3 depuis son Espace artiste, la pochette va dans le dépôt `cx-muzik` (`op/cv/artiste<n>/cover<k>.jpg`), puis on ajoute le titre à la bonne ligne de `trackTitles` dans `src/script.js`.

Les sons et les vidéos sont lus depuis GitHub Pages (`cx-muzik/media/`), pour ne pas épuiser la bande passante gratuite de Supabase. Un fichier pas encore copié est lu sur Supabase automatiquement (`src/media.js`). Pour copier les nouveaux fichiers :

```bash
git clone https://github.com/CX-Banger/cx-muzik.git ../cx-muzik   # la première fois
node outils/synchroniser-medias.mjs ../cx-muzik                   # ne copie que ce qui manque
cd ../cx-muzik && git add media && git commit -m "Nouveaux médias" && git push
```

Le code ne contient que la clé publique Supabase. Les droits sont imposés côté base (Row Level Security). Les identifiants des artistes ne sont jamais versionnés : `comptes-artistes.txt` est dans `.gitignore`.

Un workflow GitHub Actions interroge Supabase chaque jour pour que le projet gratuit ne se mette pas en pause.

---

Code sous licence [Apache 2.0](LICENSE). Les musiques, pochettes et vidéos appartiennent à leurs artistes.

/* =====================================================================
   ÉVÉNEMENTS MUZIKLY (scènes ouvertes, sorties, concerts)
   ---------------------------------------------------------------------
   ⚠️ Les événements ci-dessous sont des EXEMPLES pour montrer l'interface.
   Remplace-les par tes vrais événements (ou supprime-les).

   Champs :
   - id        : identifiant unique, utilisé dans l'URL (#/event/<id>)
   - type      : 'scene' (scène ouverte), 'album' (sortie), 'concert'
   - artistId  : numéro de l'artiste (1 = NΛN … 10 = Paguiel), ou null
   - title     : nom de l'événement (sinon le nom de l'artiste est utilisé)
   - date      : 'AAAA-MM-JJ'      - time : 'HH:MM'
   - city, venue, address : lieu (inutile pour une sortie)
   - lat, lng  : coordonnées du lieu (pour le filtre « À proximité »)
   - image     : affiche de l'événement (sinon l'affiche Muzikly par défaut)
   - ticketUrl : lien billetterie / inscription (facultatif)
   - teaser    : lien d'une vidéo teaser .mp4 (facultatif, affichée en haut de la fiche)
   ===================================================================== */

export const EVENTS = [
  {
    id: 'scene-ouverte-novembre',
    type: 'scene',
    artistId: null,
    title: 'Scène ouverte Muzikly',
    date: '2026-11-07',
    time: '19:00',
    city: 'Paris',
    lat: 48.8566, lng: 2.3522,
    venue: 'Studio ConnexionBanger',
    address: 'Adresse communiquée aux inscrits',
    ticketUrl: ''
  },
  {
    id: 'nan-live',
    type: 'concert',
    artistId: 1,
    date: '2026-11-19',
    time: '20:00',
    city: 'Paris',
    lat: 48.8566, lng: 2.3522,
    venue: 'Studio ConnexionBanger',
    address: 'Adresse à venir',
    ticketUrl: ''
  },
  {
    id: 'synai-album',
    type: 'album',
    artistId: 2,
    title: 'Nouvel album de Synaï',
    date: '2026-12-04',
    time: '00:00',
    teaser: ''
  },
  {
    id: 'nan-showcase',
    type: 'concert',
    artistId: 1,
    date: '2026-11-27',
    time: '20:30',
    city: 'Lyon',
    lat: 45.764, lng: 4.8357,
    venue: 'Salle à confirmer',
    address: 'Adresse à venir',
    ticketUrl: ''
  },
  {
    id: 'nan-decembre',
    type: 'concert',
    artistId: 1,
    date: '2026-12-12',
    time: '20:00',
    city: 'Bruxelles',
    lat: 50.8503, lng: 4.3517,
    venue: 'Salle à confirmer',
    address: 'Adresse à venir',
    ticketUrl: ''
  },
  {
    id: 'eilynn-ep',
    type: 'album',
    artistId: 5,
    title: 'EP d\'Eilynn',
    date: '2027-01-16',
    time: '00:00',
    teaser: ''
  }
];

/* =====================================================================
   BANDSINTOWN FOR ARTISTS
   ---------------------------------------------------------------------
   Si un artiste a un compte « Bandsintown for Artists » avec ses concerts,
   indique ici son nom exact sur Bandsintown (ou son identifiant « id_12345 »).
   Le widget officiel Bandsintown s'affichera alors sur sa fiche, avec
   ses dates, la billetterie et le bouton RSVP. Laisse '' sinon.
   ===================================================================== */
export const BANDSINTOWN = {
  1: '',  // NΛN
  2: '',  // Synaï
  3: '',  // Elihem
  4: '',  // Sara
  5: '',  // Eilynn
  6: '',  // Melohim
  7: '',  // Tiim
  8: '',  // Math
  9: '',  // Raph
  10: ''  // Paguiel
};

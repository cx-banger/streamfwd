/* =====================================================================
   Connexion au projet Supabase des sons (hrzmag… / cx-banger-sons)
   Partagée par l'app (lecture publique) et l'Espace artiste (comptes).
   Seule la clé publique « anon » est utilisée, jamais la clé service_role.
   ===================================================================== */
import { createClient } from '@supabase/supabase-js';

export const SONS_URL = 'https://hrzmagjjobctkfxayokt.supabase.co';
// Clé publique (rôle « anon ») : elle est faite pour être dans le navigateur.
export const SONS_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyem1hZ2pqb2JjdGtmeGF5b2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDMyMTYsImV4cCI6MjA3NDQ3OTIxNn0.gCwV9AllAS10-TwMoJNfrO3IVKfgOcWBMxYIBCaaIH8';

let client = null;
export function sons() {
  if (!client) {
    client = createClient(SONS_URL, SONS_ANON_KEY, {
      auth: { storageKey: 'muzikly-espace-artiste', persistSession: true, autoRefreshToken: true }
    });
  }
  return client;
}

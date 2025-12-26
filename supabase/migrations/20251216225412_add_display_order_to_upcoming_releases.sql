/*
  # Add display order to upcoming releases

  1. Changes
    - Add `display_order` column to `upcoming_releases` table
      - Type: integer
      - Default: 0
      - Used to control the order of releases in the feed
    
  2. Data Updates
    - Set display order for existing releases:
      - "Rédemption" (NAN): order 1
      - "Nouvelle Création" (Synaï): order 2
      - "À venir bientôt" (Eilynn): order 3
      - "Summer Vibes" (Sara): order 4 (last)
*/

-- Add display_order column
ALTER TABLE upcoming_releases 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update display order for existing releases
UPDATE upcoming_releases 
SET display_order = 1 
WHERE title = 'Rédemption' AND artist_name = 'NAN';

UPDATE upcoming_releases 
SET display_order = 2 
WHERE title = 'Nouvelle Création' AND artist_name = 'Synaï';

UPDATE upcoming_releases 
SET display_order = 3 
WHERE title = 'À venir bientôt' AND artist_name = 'Eilynn';

UPDATE upcoming_releases 
SET display_order = 4 
WHERE title = 'Summer Vibes' AND artist_name = 'Phil Wickham, Brandon Lake, Hulvey';

UPDATE upcoming_releases 
SET display_order = 5 
WHERE title = 'Pas assez' AND artist_name = 'Conozco';

UPDATE upcoming_releases 
SET display_order = 6 
WHERE title = 'True (Official Audio)' AND artist_name = 'Hulvey';

UPDATE upcoming_releases 
SET display_order = 7 
WHERE title = 'True (Official Audio)' AND artist_name = 'Conozco, Nehiyr';

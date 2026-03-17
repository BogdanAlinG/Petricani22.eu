/*
  # Add Folder Organization to Media Library

  1. Changes
    - Add `folder` column to `media_library` table for organizing media by purpose
    - Add index on folder column for efficient filtering

  2. Default Folders
    - NULL folder means "Uncategorized"
    - Common folders: Hero, Gallery, Products, Thumbnails, Blog, etc.
*/

ALTER TABLE media_library ADD COLUMN IF NOT EXISTS folder text;

CREATE INDEX IF NOT EXISTS idx_media_library_folder ON media_library(folder);
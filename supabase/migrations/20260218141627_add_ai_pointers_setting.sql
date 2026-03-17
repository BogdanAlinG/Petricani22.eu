/*
  # Add AI Pointers Setting

  Inserts a default `ai_pointers` row into `site_settings` so admins can
  provide factual notes that are injected into every AI generation prompt.
  This prevents the AI from making up incorrect facts about the property
  (e.g. wrong location, wrong features, etc.).

  1. Changes
    - Inserts key `ai_pointers` in group `ai` into `site_settings`
    - Pre-populated with an example pointer about the property location
*/

INSERT INTO site_settings (key, value_en, value_ro, type, "group", description)
VALUES (
  'ai_pointers',
  '- The property is located in the Lacul Tei / Pipera area of Bucharest, NOT in the city center.',
  '- Proprietatea se află în zona Lacul Tei / Pipera din București, NU în centrul orașului.',
  'textarea',
  'ai',
  'Factual pointers injected into every AI generation prompt. One bullet point per line. Use these to correct wrong assumptions or provide key facts about the property.'
)
ON CONFLICT (key) DO NOTHING;

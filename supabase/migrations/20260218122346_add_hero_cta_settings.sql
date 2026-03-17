/*
  # Add CTA button labels to hero section settings

  Updates the hero page_section's settings column to include CTA button text
  in both languages, so they can be managed from the Content Editor.
*/

UPDATE page_sections
SET settings = jsonb_build_object(
  'cta1_en', 'Request Custom Offer',
  'cta1_ro', 'Solicită Ofertă Personalizată',
  'cta2_en', 'Schedule Viewing',
  'cta2_ro', 'Programează Vizionare'
)
WHERE page = 'home' AND section = 'hero';

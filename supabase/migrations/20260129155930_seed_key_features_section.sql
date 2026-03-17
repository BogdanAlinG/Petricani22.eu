/*
  # Seed Key Features Section

  1. New Data
    - Creates a "features" page section for the homepage
    - Creates 8 content blocks representing each key feature
    - Each block has English and Romanian translations
    - Icons are stored as string names for dynamic rendering

  2. Features Added
    - 440m2 Built Area
    - 12 Rooms
    - 4 Bathrooms
    - 2 Levels
    - Brick Pizza Oven
    - Built 2005
    - 25m Street Frontage
    - Private Parking
*/

DO $$
DECLARE
  section_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM page_sections WHERE page = 'home' AND section = 'features'
  ) THEN
    INSERT INTO page_sections (
      page,
      section,
      title_en,
      title_ro,
      subtitle_en,
      subtitle_ro,
      is_visible,
      display_order
    ) VALUES (
      'home',
      'features',
      'Key Features',
      'Caracteristici Cheie',
      'Generous space with modern facilities for any type of use',
      'Spatiu generos cu facilitati moderne pentru orice tip de utilizare',
      true,
      1
    )
    RETURNING id INTO section_id;

    INSERT INTO content_blocks (section_id, type, icon, title_en, title_ro, description_en, description_ro, display_order, is_visible)
    VALUES
      (section_id, 'feature', 'Maximize', '440m2 Built Area', '440m2 Suprafata Construita', 'On 1600m2 land', 'Pe teren de 1600m2', 0, true),
      (section_id, 'feature', 'Bed', '12 Rooms', '12 Camere', 'Versatile and bright spaces', 'Spatii versatile si luminoase', 1, true),
      (section_id, 'feature', 'Bath', '4 Bathrooms', '4 Bai', 'Fully equipped and modern', 'Complet echipate si moderne', 2, true),
      (section_id, 'feature', 'Home', '2 Levels', '2 Nivele', 'Ground floor + upper floor', 'Parter si etaj', 3, true),
      (section_id, 'feature', 'Settings', 'Brick Pizza Oven', 'Cuptor Pizza din Caramida', 'In courtyard', 'In cladire', 4, true),
      (section_id, 'feature', 'Calendar', 'Built 2005', 'Constructie 2005', 'Modern property', 'Proprietate moderna', 5, true),
      (section_id, 'feature', 'Road', '25m Street Frontage', '25m Deschidere la Strada', 'Excellent access', 'Acces excelent', 6, true),
      (section_id, 'feature', 'Car', 'Private Parking', 'Parcare Privata', 'Multiple spaces available', 'Spatii multiple disponibile', 7, true);
  END IF;
END $$;

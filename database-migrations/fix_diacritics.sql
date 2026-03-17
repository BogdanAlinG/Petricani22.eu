-- =============================================
-- Comprehensive Corrupted Romanian Diacritics Fix
-- =============================================
-- Run this script in the Supabase SQL Editor.

DO $$
DECLARE
    -- The replacements array: [corrupted, fixed]
    -- Since direct client-string replacement wasn't catching the double-encoded bytes in the CMS tables,
    -- we use PostgreSQL's convert_from(convert_to(str, 'UTF8'), 'LATIN1') trick to generate the exact 
    -- byte sequence the database is storing for these corrupted characters.
    replacements text[][] := ARRAY[
        [convert_from(convert_to('ă', 'UTF8'), 'LATIN1'), 'ă'],
        [convert_from(convert_to('Ă', 'UTF8'), 'LATIN1'), 'Ă'],
        [convert_from(convert_to('â', 'UTF8'), 'LATIN1'), 'â'],
        [convert_from(convert_to('Â', 'UTF8'), 'LATIN1'), 'Â'],
        [convert_from(convert_to('î', 'UTF8'), 'LATIN1'), 'î'],
        [convert_from(convert_to('Î', 'UTF8'), 'LATIN1'), 'Î'],
        [convert_from(convert_to('ș', 'UTF8'), 'LATIN1'), 'ș'],
        [convert_from(convert_to('Ș', 'UTF8'), 'LATIN1'), 'Ș'],
        [convert_from(convert_to('ț', 'UTF8'), 'LATIN1'), 'ț'],
        [convert_from(convert_to('Ț', 'UTF8'), 'LATIN1'), 'Ț'],
        
        -- Also include the explicit literal strings as fallback
        ['Äƒ', 'ă'],
        ['Ä‚', 'Ă'],
        ['Ã¢', 'â'],
        ['Ã‚', 'Â'],
        ['Ã®', 'î'],
        ['ÃŽ', 'Î'],
        ['È™', 'ș'],
        ['È˜', 'Ș'],
        ['È›', 'ț'],
        ['Èš', 'Ț']
    ];
    rep text[];
BEGIN
    FOR i IN 1 .. array_length(replacements, 1) LOOP
        rep := replacements[i];
        
        -- Core Accommodations & Bookings
        UPDATE accommodations SET 
            title_ro = COALESCE(REPLACE(title_ro, rep[1], rep[2]), title_ro),
            short_description_ro = COALESCE(REPLACE(short_description_ro, rep[1], rep[2]), short_description_ro),
            description_ro = COALESCE(REPLACE(description_ro, rep[1], rep[2]), description_ro);

        UPDATE accommodation_images SET 
            alt_text_ro = COALESCE(REPLACE(alt_text_ro, rep[1], rep[2]), alt_text_ro);

        UPDATE house_rules SET 
            title_ro = COALESCE(REPLACE(title_ro, rep[1], rep[2]), title_ro),
            description_ro = COALESCE(REPLACE(description_ro, rep[1], rep[2]), description_ro);

        UPDATE points_of_interest SET 
            name_ro = COALESCE(REPLACE(name_ro, rep[1], rep[2]), name_ro);

        UPDATE rental_options SET 
            title_ro = COALESCE(REPLACE(title_ro, rep[1], rep[2]), title_ro),
            description_ro = COALESCE(REPLACE(description_ro, rep[1], rep[2]), description_ro),
            features_ro = COALESCE(REPLACE(features_ro::text, rep[1], rep[2])::text[], features_ro);

        -- Amenities
        UPDATE amenity_categories SET 
            name_ro = COALESCE(REPLACE(name_ro, rep[1], rep[2]), name_ro);

        UPDATE amenities SET 
            name_ro = COALESCE(REPLACE(name_ro, rep[1], rep[2]), name_ro);

        -- Food & Beverage / Products
        UPDATE categories SET 
            name_ro = COALESCE(REPLACE(name_ro, rep[1], rep[2]), name_ro),
            description_ro = COALESCE(REPLACE(description_ro, rep[1], rep[2]), description_ro);

        UPDATE products SET 
            title_ro = COALESCE(REPLACE(title_ro, rep[1], rep[2]), title_ro),
            short_description_ro = COALESCE(REPLACE(short_description_ro, rep[1], rep[2]), short_description_ro),
            full_description_ro = COALESCE(REPLACE(full_description_ro, rep[1], rep[2]), full_description_ro),
            special_mentions_ro = COALESCE(REPLACE(special_mentions_ro, rep[1], rep[2]), special_mentions_ro),
            ingredients_ro = COALESCE(REPLACE(ingredients_ro, rep[1], rep[2]), ingredients_ro),
            dietary_tags = COALESCE(REPLACE(dietary_tags::text, rep[1], rep[2])::text[], dietary_tags),
            allergen_info = COALESCE(REPLACE(allergen_info::text, rep[1], rep[2])::text[], allergen_info);

        UPDATE product_sizes SET 
            size_name_ro = COALESCE(REPLACE(size_name_ro, rep[1], rep[2]), size_name_ro);

        UPDATE delivery_time_slots SET 
            slot_name_ro = COALESCE(REPLACE(slot_name_ro, rep[1], rep[2]), slot_name_ro);

        UPDATE allergens SET 
            name_ro = COALESCE(REPLACE(name_ro, rep[1], rep[2]), name_ro);

        -- Content & CMS
        UPDATE page_sections SET 
            title_ro = COALESCE(REPLACE(title_ro, rep[1], rep[2]), title_ro),
            subtitle_ro = COALESCE(REPLACE(subtitle_ro, rep[1], rep[2]), subtitle_ro),
            content_ro = COALESCE(REPLACE(content_ro, rep[1], rep[2]), content_ro),
            settings = COALESCE(REPLACE(settings::text, rep[1], rep[2])::jsonb, settings);

        UPDATE content_blocks SET 
            title_ro = COALESCE(REPLACE(title_ro, rep[1], rep[2]), title_ro),
            description_ro = COALESCE(REPLACE(description_ro, rep[1], rep[2]), description_ro),
            settings = COALESCE(REPLACE(settings::text, rep[1], rep[2])::jsonb, settings);

        UPDATE articles SET 
            title_ro = COALESCE(REPLACE(title_ro, rep[1], rep[2]), title_ro),
            excerpt_ro = COALESCE(REPLACE(excerpt_ro, rep[1], rep[2]), excerpt_ro),
            content_ro = COALESCE(REPLACE(content_ro, rep[1], rep[2]), content_ro),
            read_time_ro = COALESCE(REPLACE(read_time_ro, rep[1], rep[2]), read_time_ro),
            tags = COALESCE(REPLACE(tags::text, rep[1], rep[2])::text[], tags);

        UPDATE guidebook_categories SET 
            title_ro = COALESCE(REPLACE(title_ro, rep[1], rep[2]), title_ro);

        UPDATE guidebook_items SET 
            title_ro = COALESCE(REPLACE(title_ro, rep[1], rep[2]), title_ro),
            content_ro = COALESCE(REPLACE(content_ro, rep[1], rep[2]), content_ro);

        UPDATE site_settings SET 
            value_ro = COALESCE(REPLACE(value_ro, rep[1], rep[2]), value_ro);

        UPDATE faqs SET 
            question_ro = COALESCE(REPLACE(question_ro, rep[1], rep[2]), question_ro),
            answer_ro = COALESCE(REPLACE(answer_ro, rep[1], rep[2]), answer_ro);

        UPDATE testimonials SET 
            content_ro = COALESCE(REPLACE(content_ro, rep[1], rep[2]), content_ro);

        UPDATE media_library SET 
            alt_text_ro = COALESCE(REPLACE(alt_text_ro, rep[1], rep[2]), alt_text_ro);

        UPDATE navigation_menus SET 
            label_ro = COALESCE(REPLACE(label_ro, rep[1], rep[2]), label_ro);

    END LOOP;
END $$;

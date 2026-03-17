import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const replacements = {
    'Äƒ': 'ă', 'Ä‚': 'Ă',
    'Ã¢': 'â', 'Ã‚': 'Â',
    'Ã®': 'î', 'ÃŽ': 'Î',
    'È™': 'ș', 'È˜': 'Ș',
    'È›': 'ț', 'Èš': 'Ț',
    'Ã£': 'ă', // just in case
    'MÃ¢ncare': 'Mâncare',
    'LocaÈ›ie': 'Locație',
    'multifuncÈ›ionalÄƒ': 'multifuncțională',
    'È™i': 'și',
    'unitÄƒÈ›i': 'unități'
};

async function fixDiacritics() {
    console.log('Fetching page sections...');
    const { data: sections, error } = await supabase.from('page_sections').select('*');
    if (error) {
        console.error('Error fetching sections:', error);
        return;
    }

    let fixed = 0;

    for (const section of sections) {
        let needsUpdate = false;
        let updateData = {};

        ['title_ro', 'subtitle_ro', 'content_ro'].forEach(field => {
            if (section[field]) {
                let original = section[field];
                let val = original;
                for (const [corrupt, fixedChar] of Object.entries(replacements)) {
                    val = val.split(corrupt).join(fixedChar);
                }
                if (val !== original) {
                    updateData[field] = val;
                    needsUpdate = true;
                }
            }
        });

        // Also check settings JSON
        if (section.settings) {
            let settingsStr = JSON.stringify(section.settings);
            let originalStr = settingsStr;
            for (const [corrupt, fixedChar] of Object.entries(replacements)) {
                settingsStr = settingsStr.split(corrupt).join(fixedChar);
            }
            if (settingsStr !== originalStr) {
                updateData.settings = JSON.parse(settingsStr);
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            console.log('Fixing section:', section.id);
            const { error: updateError } = await supabase
                .from('page_sections')
                .update(updateData)
                .eq('id', section.id);

            if (updateError) console.error('Error updating:', updateError);
            else fixed++;
        }
    }

    console.log('Fixed', fixed, 'page sections.');
}

fixDiacritics().catch(console.error);

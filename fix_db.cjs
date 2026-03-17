const fs = require('fs');
let envStr = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of envStr.split('\n')) {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
}

function escapeSql(str) {
    if (!str) return 'NULL';
    return "'" + str.replace(/'/g, "''") + "'";
}

function decodeBrokenUTF8(str) {
    if (!str) return str;
    let decoded = str;

    // Some strings might be triple or quadruple encoded, so we decode them until they stop changing
    let previous = "";
    let attempts = 0;

    while (decoded !== previous && attempts < 4) {
        previous = decoded;
        try {
            decoded = decodeURIComponent(escape(decoded));
        } catch (e) {
            break; // Stop if it's no longer valid double-encoded byte strings
        }
        attempts++;
    }

    // Extra fallback for weird character artifacts that survive the decode loop
    const fallbacks = {
        'MÃ¢ncare': 'Mâncare',
        'LocaÈ›ie': 'Locație',
        'multifuncÈ›ionalÄƒ': 'multifuncțională',
        'Äƒ': 'ă', 'Ä‚': 'Ă',
        'Ã¢': 'â', 'Ã‚': 'Â',
        'Ã®': 'î', 'ÃŽ': 'Î',
        'È™': 'ș', 'È˜': 'Ș',
        'È›': 'ț', 'Èš': 'Ț'
    };
    for (const [corrupt, fixedChar] of Object.entries(fallbacks)) {
        decoded = decoded.split(corrupt).join(fixedChar);
    }
    return decoded;
}

async function generateSQL() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    let sqlContent = `-- ==========================================================\n`;
    sqlContent += `-- CMS Diacritics Direct Overwrite Script (Bypasses RLS)\n`;
    sqlContent += `-- ==========================================================\n\n`;

    console.log('Fetching page_sections...');
    const { data: sections } = await supabase.from('page_sections').select('*');

    for (const section of sections || []) {
        let needsUpdate = false;
        let updateData = {};

        ['title_ro', 'subtitle_ro', 'content_ro'].forEach(field => {
            if (section[field]) {
                let val = decodeBrokenUTF8(section[field]);
                if (val !== section[field]) { updateData[field] = val; needsUpdate = true; }
            }
        });

        if (section.settings) {
            let settingsStr = JSON.stringify(section.settings);
            let val = decodeBrokenUTF8(settingsStr);
            if (val !== settingsStr) { updateData.settings = JSON.parse(val); needsUpdate = true; }
        }

        if (needsUpdate) {
            let sets = [];
            if (updateData.title_ro !== undefined) sets.push(`title_ro = ${escapeSql(updateData.title_ro)}`);
            if (updateData.subtitle_ro !== undefined) sets.push(`subtitle_ro = ${escapeSql(updateData.subtitle_ro)}`);
            if (updateData.content_ro !== undefined) sets.push(`content_ro = ${escapeSql(updateData.content_ro)}`);
            if (updateData.settings !== undefined) sets.push(`settings = '${JSON.stringify(updateData.settings).replace(/'/g, "''")}'::jsonb`);

            sqlContent += `UPDATE page_sections SET ${sets.join(', ')} WHERE id = '${section.id}';\n`;
        }
    }

    console.log('Fetching content_blocks...');
    const { data: blocks } = await supabase.from('content_blocks').select('*');

    for (const block of blocks || []) {
        let needsUpdate = false;
        let updateData = {};

        ['title_ro', 'description_ro', 'content_ro'].forEach(field => {
            if (block[field]) {
                let val = decodeBrokenUTF8(block[field]);
                if (val !== block[field]) { updateData[field] = val; needsUpdate = true; }
            }
        });

        if (block.settings) {
            let settingsStr = JSON.stringify(block.settings);
            let val = decodeBrokenUTF8(settingsStr);
            if (val !== settingsStr) { updateData.settings = JSON.parse(val); needsUpdate = true; }
        }

        if (needsUpdate) {
            let sets = [];
            if (updateData.title_ro !== undefined) sets.push(`title_ro = ${escapeSql(updateData.title_ro)}`);
            if (updateData.description_ro !== undefined) sets.push(`description_ro = ${escapeSql(updateData.description_ro)}`);
            if (updateData.content_ro !== undefined) sets.push(`content_ro = ${escapeSql(updateData.content_ro)}`);
            if (updateData.settings !== undefined) sets.push(`settings = '${JSON.stringify(updateData.settings).replace(/'/g, "''")}'::jsonb`);

            sqlContent += `UPDATE content_blocks SET ${sets.join(', ')} WHERE id = '${block.id}';\n`;
        }
    }

    fs.writeFileSync('database-migrations/fix_cms_hardcode.sql', sqlContent, 'utf8');
    console.log('Successfully generated clean fix_cms_hardcode.sql');
}

generateSQL().catch(console.error);

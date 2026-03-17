const fs = require('fs');
let envStr = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of envStr.split('\n')) {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
}

const map = {
    '\u00C4\u0192': 'ă', // Äƒ
    '\u00C4\u201A': 'Ă', // Ä‚
    '\u00C3\u00A2': 'â', // Ã¢
    '\u00C3\u201A': 'Â', // Ã‚
    '\u00C3\u00AE': 'î', // Ã®
    '\u00C3\u017D': 'Î', // ÃŽ
    '\u00C8\u2122': 'ș', // È™
    '\u00C8\u02DC': 'Ș', // È˜
    '\u00C8\u203A': 'ț', // È›
    '\u00C8\u0160': 'Ț', // Èš

    // Explicit hardcoded strings
    'OazÃƒÂƒÃ‚Âƒ': 'Oază',
    'OazÃƒÂƒ': 'Oază',
    'UrbanÃƒÂƒÃ‚Âƒ': 'Urbană',
    'UrbanÃƒÂƒ': 'Urbană',
    'ÃƒÂ‚Ã‚Â®n': 'în',
    'ÃƒÂ‚Ã‚Â®': 'î',
    'MÃƒÂƒÃ‚Â¢ncare': 'Mâncare',
    'MÃƒÂƒÃ‚Â¢': 'Mân',
    'LocaÃƒÂˆÃ‚Â›ie': 'Locație',
    'multifuncÃƒÂˆÃ‚Â›ionalÃƒÂƒÃ‚Âƒ': 'multifuncțională',
    'È™i': 'și',
    'unitÃƒÂƒÃ‚ÂƒÃƒÂˆÃ‚Â›i': 'unități',
    'ÃƒÂˆÃ‚Â™i': 'și'
};

function escapeSql(str) {
    if (!str) return 'NULL';
    return "'" + str.replace(/'/g, "''") + "'";
}

async function fixFeatures() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    let sqlContent = `-- ==========================================================\n`;
    sqlContent += `-- Features Table Diacritics Overwrite Script\n`;
    sqlContent += `-- ==========================================================\n\n`;

    const { data: features } = await supabase.from('features').select('id, name_ro, description_ro');

    let updates = 0;
    for (const feature of features || []) {
        let needsUpdate = false;
        let updateData = {};

        ['name_ro', 'description_ro'].forEach(field => {
            if (feature[field]) {
                let original = feature[field];
                let val = original;
                for (const [corrupt, fixedChar] of Object.entries(map)) {
                    val = val.split(corrupt).join(fixedChar);
                }
                if (val !== original) { updateData[field] = val; needsUpdate = true; }
            }
        });

        if (needsUpdate) {
            updates++;
            let sets = [];
            if (updateData.name_ro !== undefined) sets.push(`name_ro = ${escapeSql(updateData.name_ro)}`);
            if (updateData.description_ro !== undefined) sets.push(`description_ro = ${escapeSql(updateData.description_ro)}`);

            sqlContent += `UPDATE features SET ${sets.join(', ')} WHERE id = '${feature.id}';\n`;
        }
    }

    fs.writeFileSync('database-migrations/fix_features_hardcode.sql', sqlContent, 'utf8');
    console.log('Successfully generated fix_features_hardcode.sql with ' + updates + ' updates.');
}

fixFeatures().catch(console.error);

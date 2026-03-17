const fs = require('fs');
let content = fs.readFileSync('blocks_debug.json', 'utf8');

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

    // Explicit strings from screenshot + previous quadruple encodings
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
    'ÃƒÂˆÃ‚Â™i': 'și',
    'ClimÃƒÂƒÃ‚Âƒ': 'Climă',
    'VitezÃƒÂƒÃ‚Âƒ': 'Viteză',
    'SpaÃƒÂˆÃ‚Â›ii': 'Spații',
    'SpaÃƒÂˆÃ‚Â›iu': 'Spațiu',
    'FacilitÃƒÂƒÃ‚ÂƒÃƒÂˆÃ‚Â›i': 'Facilități',
    'OpÃƒÂˆÃ‚Â›iuni': 'Opțiuni',
    'GrÃƒÂƒÃ‚ÂƒdinÃƒÂƒÃ‚Âƒ': 'Grădină',
    'CamerÃƒÂƒÃ‚Âƒ': 'Cameră',
    'utilitÃƒÂƒÃ‚ÂƒÃƒÂˆÃ‚Â›i': 'utilități',
    'MaÈ™inÄƒ de spÄƒlat': 'Mașină de spălat',
    'MaÈ™inÄƒ': 'Mașină',
    'spÄƒlat': 'spălat',
    'Ã®ncÄƒlzire': 'încălzire',
    'rÄƒcire': 'răcire',
    'fibrÄƒ opticÄƒ': 'fibră optică',
    'toatÄƒ': 'toată',
    'privatÄƒ': 'privată',
    'flexibilÄƒ': 'flexibilă',
    'preferinÈ›e': 'preferințe',
    'superioarÄƒ': 'superioară',
    'separatÄƒ': 'separată'
};

let oldContent = content;
for (const [corrupt, fixedChar] of Object.entries(map)) {
    content = content.split(corrupt).join(fixedChar);
}

// Second pass for double-encoded fallbacks
for (const [corrupt, fixedChar] of Object.entries(map)) {
    content = content.split(corrupt).join(fixedChar);
}

fs.writeFileSync('blocks_debug_fixed.json', content, 'utf8');

if (content !== oldContent) {
    console.log('Successfully fixed diacritics using Unicode Escapes in JSON!');
} else {
    console.log('No matches found for strings in JSON.');
}

const data = JSON.parse(content);

let sqlContent = `-- ==========================================================\n`;
sqlContent += `-- Content Blocks Amenities/Features Diacritics Overwrite Script\n`;
sqlContent += `-- ==========================================================\n\n`;

function escapeSql(str) {
    if (!str) return 'NULL';
    return "'" + str.replace(/'/g, "''") + "'";
}

for (const block of data || []) {
    let sets = [];
    if (block.title_ro) sets.push(`title_ro = ${escapeSql(block.title_ro)}`);
    if (block.description_ro) sets.push(`description_ro = ${escapeSql(block.description_ro)}`);
    if (block.content_ro) sets.push(`content_ro = ${escapeSql(block.content_ro)}`);
    if (block.settings) sets.push(`settings = '${JSON.stringify(block.settings).replace(/'/g, "''")}'::jsonb`);

    if (sets.length > 0) {
        sqlContent += `UPDATE content_blocks SET ${sets.join(', ')} WHERE id = '${block.id}';\n`;
    }
}

fs.writeFileSync('database-migrations/fix_content_blocks_hardcode.sql', sqlContent, 'utf8');
console.log('Generated database-migrations/fix_content_blocks_hardcode.sql');

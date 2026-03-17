const fs = require('fs');

let content = fs.readFileSync('cms_dump.json', 'utf8');

// Using unicode escapes to avoid file encoding bugs
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

    // Explicit hardcoded strings based on the quadruple encoded mess
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

let oldContent = content;
for (const [corrupt, fixedChar] of Object.entries(map)) {
    content = content.split(corrupt).join(fixedChar);
}

fs.writeFileSync('cms_dump_fixed.json', content, 'utf8');

if (content !== oldContent) {
    console.log('Fixed diacritics using Unicode Escapes!');
} else {
    console.log('No changes made.');
}

// NOW generate SQL from the fixed JSON
const data = JSON.parse(content);
let sqlContent = `-- ==========================================================\n`;
sqlContent += `-- CMS Diacritics Direct Overwrite Script (Bypasses RLS)\n`;
sqlContent += `-- ==========================================================\n\n`;

function escapeSql(str) {
    if (!str) return 'NULL';
    return "'" + str.replace(/'/g, "''") + "'";
}

for (const section of data.sections || []) {
    let sets = [];
    if (section.title_ro) sets.push(`title_ro = ${escapeSql(section.title_ro)}`);
    if (section.subtitle_ro) sets.push(`subtitle_ro = ${escapeSql(section.subtitle_ro)}`);
    if (section.content_ro) sets.push(`content_ro = ${escapeSql(section.content_ro)}`);
    if (section.settings) sets.push(`settings = '${JSON.stringify(section.settings).replace(/'/g, "''")}'::jsonb`);

    if (sets.length > 0) {
        sqlContent += `UPDATE page_sections SET ${sets.join(', ')} WHERE id = '${section.id}';\n`;
    }
}

for (const block of data.blocks || []) {
    let sets = [];
    if (block.title_ro) sets.push(`title_ro = ${escapeSql(block.title_ro)}`);
    if (block.description_ro) sets.push(`description_ro = ${escapeSql(block.description_ro)}`);
    if (block.content_ro) sets.push(`content_ro = ${escapeSql(block.content_ro)}`);
    if (block.settings) sets.push(`settings = '${JSON.stringify(block.settings).replace(/'/g, "''")}'::jsonb`);

    if (sets.length > 0) {
        sqlContent += `UPDATE content_blocks SET ${sets.join(', ')} WHERE id = '${block.id}';\n`;
    }
}

fs.writeFileSync('database-migrations/fix_cms_hardcode.sql', sqlContent, 'utf8');
console.log('Generated database-migrations/fix_cms_hardcode.sql from cleaned JSON.');

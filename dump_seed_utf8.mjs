import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OLD Supabase instance (Source)
const supabaseUrl = 'https://kdnnfmggpdriygaehxtn.supabase.co';
// Read old anon key from a safe place or hardcode temporarily for the script
const supabaseKey = process.env.OLD_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtkbm5mbWdncGRyaXlnYWVoeHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxOTIzNDcsImV4cCI6MjA4Mzc2ODM0N30.sEKfnadglwdKeGaevJZRg7abG0ozsjPYNoT4CrKOCiU';

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToExport = [
    'accommodations',
    'amenities',
    'accommodation_amenities',
    'products',
    'product_sizes',
    'product_customizations',
    'rental_options',
    'articles',
    'events',
    'house_rules',
    'guidebook_categories',
    'guidebook_items',
    'contact_messages',
    'reservations',
    'delivery_orders'
];

function escapeSQL(value, columnName) {
    if (value === null || value === undefined) return 'NULL';

    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';

    if (typeof value === 'number') return value.toString();

    // Specific fix for text[] arrays
    const textArrayColumns = ['features_en', 'features_ro', 'allergen_info', 'dietary_tags', 'tags'];
    if (textArrayColumns.includes(columnName)) {
        if (Array.isArray(value)) {
            const escapedVals = value.map(v => `"${v.replace(/"/g, '\\"')}"`);
            return `'{${escapedVals.join(',')}}'::text[]`;
        }
    }

    // Handle jsonb objects/arrays
    if (Array.isArray(value) || typeof value === 'object') {
        return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
    }

    // String escaping
    return `'${String(value).replace(/'/g, "''")}'`;
}

async function exportData() {
    console.log('Starting data export from older Supabase instance...');
    let sqlOutput = '-- =============================================\n';
    sqlOutput += '-- Seed Data Export (UTF-8)\n';
    sqlOutput += '-- =============================================\n\n';

    for (const table of tablesToExport) {
        console.log(`Fetching data for ${table}...`);
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
            continue;
        }

        if (!data || data.length === 0) {
            console.log(`No data found for ${table}, skipping.`);
            continue;
        }

        console.log(`Exporting ${data.length} rows for ${table}...`);
        sqlOutput += `-- Table: ${table}\n`;

        for (const row of data) {
            const columns = Object.keys(row).map(k => `"${k}"`).join(', ');
            const values = Object.entries(row).map(([k, v]) => escapeSQL(v, k)).join(', ');
            sqlOutput += `INSERT INTO "${table}" (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlOutput += '\n';
    }

    const outputPath = path.join(__dirname, 'database-migrations', '002_seed_data.sql');
    fs.writeFileSync(outputPath, sqlOutput, 'utf8');
    console.log(`\nExport complete! Seed data written to ${outputPath} with UTF-8 encoding.`);
}

exportData().catch(console.error);

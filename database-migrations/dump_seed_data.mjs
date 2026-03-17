/**
 * Dumps all publicly-accessible Supabase table data into a seed SQL file.
 * Run with: node dump_seed_data.mjs
 */

const SUPABASE_URL = 'https://kdnnfmggpdriygaehxtn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtkbm5mbWdncGRyaXlnYWVoeHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxOTIzNDcsImV4cCI6MjA4Mzc2ODM0N30.sEKfnadglwdKeGaevJZRg7abG0ozsjPYNoT4CrKOCiU';

import { writeFileSync } from 'fs';

// Tables to dump, in dependency order (parents before children)
const TABLES = [
  // Independent tables first
  'amenity_categories',
  'allergens',
  'house_rules',
  'rental_options',
  'accommodations',
  // Tables depending on accommodations
  'accommodation_images',
  'ical_feeds',
  'ical_events',
  'blocked_dates',
  'pricing_rules',
  'bookings',
  'points_of_interest',
  // Amenities depend on amenity_categories
  'amenities',
  // Junction depends on accommodations + amenities
  'accommodation_amenities',
  // Menu system
  'categories',
  'products',
  'product_sizes',
  'product_allergens',
  // System and CMS
  'media_library',
  'faqs',
  'testimonials',
  'navigation_menus',
  'social_links',
  'page_sections',
  'content_blocks',
  'articles',
  'guidebook_categories',
  'guidebook_items',
  // Sync logs
  'sync_logs',
  'sync_log_details',
];

async function fetchAll(table) {
  const rows = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.asc&offset=${offset}&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'count=exact',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        console.log(`  ⚠ ${table}: 404 (RLS-blocked or doesn't exist)`);
        return null;
      }
      // Try without order if created_at doesn't exist
      const url2 = `${SUPABASE_URL}/rest/v1/${table}?select=*&offset=${offset}&limit=${limit}`;
      const res2 = await fetch(url2, {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res2.ok) {
        console.log(`  ⚠ ${table}: ${res2.status} ${res2.statusText}`);
        return null;
      }
      const data = await res2.json();
      return data;
    }

    const data = await res.json();
    rows.push(...data);

    if (data.length < limit) break;
    offset += limit;
  }

  return rows;
}

function escapeSQL(val, col) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);

  if (Array.isArray(val)) {
    // These specific columns are 'text[]' in PostgreSQL, not 'jsonb'
    const textArrayCols = ['features_en', 'features_ro', 'tags', 'allergen_info', 'dietary_tags'];
    if (textArrayCols.includes(col)) {
      if (val.length === 0) return `ARRAY[]::text[]`;
      const elements = val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ');
      return `ARRAY[${elements}]::text[]`;
    }
  }

  if (typeof val === 'object') {
    // Other arrays and objects → JSONB
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  // String
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateInserts(table, rows) {
  if (!rows || rows.length === 0) return '';

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(', ');

  let sql = `-- =============================================\n`;
  sql += `-- Table: ${table} (${rows.length} rows)\n`;
  sql += `-- =============================================\n\n`;

  for (const row of rows) {
    const values = columns.map((col) => escapeSQL(row[col], col)).join(', ');
    sql += `INSERT INTO "${table}" (${colList}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
  }

  sql += '\n';
  return sql;
}

async function main() {
  console.log('🔄 Fetching data from Supabase...\n');

  let fullSQL = `-- =============================================\n`;
  fullSQL += `-- Petricani22 Database Seed Data\n`;
  fullSQL += `-- Generated: ${new Date().toISOString()}\n`;
  fullSQL += `-- Source: ${SUPABASE_URL}\n`;
  fullSQL += `-- =============================================\n\n`;
  fullSQL += `-- NOTE: Run the migration files first to create the schema,\n`;
  fullSQL += `-- then run this file to populate with data.\n\n`;

  // Provide a TRUNCATE command to wipe default data from migrations
  // so we don't encounter slug unique constraint conflicts with the live UUIDs.
  const tablesList = TABLES.map(t => `"${t}"`).join(', ');
  fullSQL += `-- Clear out any default data inserted by migrations to avoid UUID/constraint conflicts\n`;
  fullSQL += `TRUNCATE TABLE ${tablesList} CASCADE;\n\n`;

  let totalRows = 0;
  let tablesProcessed = 0;
  let tablesFailed = 0;

  for (const table of TABLES) {
    process.stdout.write(`  📥 ${table}... `);
    const rows = await fetchAll(table);

    if (rows === null) {
      tablesFailed++;
      continue;
    }

    if (rows.length === 0) {
      console.log(`(empty)`);
    } else {
      console.log(`${rows.length} rows`);
      fullSQL += generateInserts(table, rows);
      totalRows += rows.length;
    }
    tablesProcessed++;
  }

  const outPath = new URL('./002_seed_data.sql', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
  writeFileSync(outPath, fullSQL, 'utf-8');

  console.log(`\n✅ Done!`);
  console.log(`   Tables processed: ${tablesProcessed}`);
  console.log(`   Tables failed/blocked: ${tablesFailed}`);
  console.log(`   Total rows exported: ${totalRows}`);
  console.log(`   Output: ${outPath}`);
}

main().catch(console.error);

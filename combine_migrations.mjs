import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const seedFile = path.join(__dirname, 'database-migrations', '002_seed_data.sql');
const outputFile = path.join(__dirname, 'database-migrations', 'run_all_migrations.sql');

function processMigration(sql) {
    // Regex to match: CREATE POLICY "Policy Name" ON table_name
    // ^ ensures it only matches top-level statements, ignoring ones already nested inside IF NOT EXISTS (which are indented)
    const policyRegex = /^CREATE\s+POLICY\s+(["']?[^"'\n]+["']?)\s+ON\s+(["']?[a-zA-Z0-9_]+["']?)/gim;

    let result = sql.replace(policyRegex, (match, policyName, tableName) => {
        return `
DO $$ 
BEGIN 
  DROP POLICY IF EXISTS ${policyName} ON ${tableName}; 
EXCEPTION 
  WHEN undefined_table THEN 
    NULL; 
END $$;
${match}`;
    });

    // Regex to match: CREATE TRIGGER trigger_name AFTER/BEFORE EVENT ON table_name
    const triggerRegex = /^CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)\s+(?:AFTER|BEFORE|INSTEAD\s+OF)\s+(?:INSERT|UPDATE|DELETE|TRUNCATE)(?:\s+OR\s+(?:INSERT|UPDATE|DELETE|TRUNCATE))*\s+ON\s+([a-zA-Z0-9_]+)/gim;

    result = result.replace(triggerRegex, (match, triggerName, tableName) => {
        return `
DO $$ 
BEGIN 
  DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName}; 
EXCEPTION 
  WHEN undefined_table THEN 
    NULL; 
END $$;
${match}`;
    });

    return result;
}

function processSQL() {
    let output = `-- =============================================
-- Petricani22 Combined Migration Runner (Hardened)
-- =============================================
-- Run this single file in the Supabase SQL Editor.
-- All operations are explicitly idempotent.
-- Generated: 2026-03-04
-- =============================================\n\n`;

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const f of files) {
        output += `\n-- =========================================================================\n`;
        output += `-- MIGRATION: ${f}\n`;
        output += `-- =========================================================================\n\n`;

        let content = fs.readFileSync(path.join(migrationsDir, f), 'utf8');

        // Inject DROP POLICY where missing
        content = processMigration(content);

        output += content + '\n';
    }

    output += `\n-- =========================================================================\n`;
    output += `-- SEED DATA (UTF-8)\n`;
    output += `-- =========================================================================\n\n`;

    if (fs.existsSync(seedFile)) {
        const seedContent = fs.readFileSync(seedFile, 'utf8');
        output += seedContent;
    } else {
        console.warn(`Seed file not found at ${seedFile}`);
    }

    fs.writeFileSync(outputFile, output, 'utf8');
    console.log(`Generated hardened run_all_migrations.sql (${Math.round(output.length / 1024)}KB)`);
}

processSQL();

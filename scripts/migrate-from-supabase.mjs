import { Pool } from 'pg';

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycXhhaXprd3VpenVobGZtZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk1NzcsImV4cCI6MjA1MDI2NTU3N30.uv3FElLBTsCNr3Vg4PooW7h1o2ZlivAFGawFH-Zqxns";
const SB_URL = "https://trqxaizkwuizuhlfmdup.supabase.co";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function fetchSupabase(table, select = '*') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?select=${select}&limit=1000`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
  });
  if (!res.ok) { const t = await res.text(); console.warn(`  ⚠ ${table}: ${res.status} ${t.slice(0,80)}`); return []; }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function upsert(table, rows, conflictCol = 'id') {
  if (!rows.length) { console.log(`  ✓ ${table}: 0 rows (empty or restricted)`); return; }
  const cols = Object.keys(rows[0]);
  let count = 0;
  for (const row of rows) {
    const vals = cols.map(c => {
      const v = row[c];
      if (v === null || v === undefined) return null;
      if (typeof v === 'object') return JSON.stringify(v);
      if (typeof v === 'boolean') return v ? '1' : '0';
      return String(v);
    });
    const placeholders = vals.map((_, i) => `$${i+1}`).join(', ');
    const nonConflict = cols.filter(c => c !== conflictCol);
    const updateSet = nonConflict.length ? nonConflict.map(c => `${c} = EXCLUDED.${c}`).join(', ') : `${conflictCol} = EXCLUDED.${conflictCol}`;
    const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${conflictCol}) DO UPDATE SET ${updateSet}`;
    try {
      await pool.query(sql, vals);
      count++;
    } catch (e) {
      console.error(`  ✗ ${table} row error: ${e.message.slice(0,100)}`);
    }
  }
  console.log(`  ✓ ${table}: ${count}/${rows.length} rows`);
}

async function main() {
  console.log('Migrating Supabase → Replit PG...\n');
  const tables = [
    ['profiles', 'id'],
    ['site_settings', 'key'],
    ['domain_listings', 'id'],
    ['domain_analytics', 'id'],
    ['domain_offers', 'id'],
    ['domain_auctions', 'id'],
    ['auction_bids', 'id'],
    ['domain_price_history', 'id'],
    ['user_reviews', 'id'],
    ['domains', 'id'],
    ['domain_verifications', 'id'],
    ['admin_roles', 'id'],
    ['smtp_settings', 'id'],
    ['user_favorites', 'id'],
    ['transactions', 'id'],
    ['escrow_services', 'id'],
  ];

  for (const [table, conflict] of tables) {
    const rows = await fetchSupabase(table);
    await upsert(table, rows, conflict);
  }

  console.log('\n✅ Migration complete!');
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });

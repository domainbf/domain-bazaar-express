import { createClient } from '@libsql/client';

const SUPABASE_URL = 'https://trqxaizkwuizuhlfmdup.supabase.co';
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const SUPABASE_SERVICE_KEY = process.env._SUPABASE_SERVICE_KEY;
if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing _SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

function toSql(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' || Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

async function fetchAll(table) {
  let all = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`,
      { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!res.ok) {
      const text = await res.text();
      if (text.includes('does not exist') || text.includes('relation') || res.status === 404) {
        console.log(`  ⚠ Table ${table} not found in Supabase, skipping`);
        return null;
      }
      console.error(`  ✗ Error fetching ${table}: ${res.status} ${text}`);
      return [];
    }
    const rows = await res.json();
    if (!Array.isArray(rows)) {
      console.log(`  ⚠ Unexpected response for ${table}: ${JSON.stringify(rows)}`);
      return [];
    }
    all = all.concat(rows);
    if (rows.length < limit) break;
    offset += limit;
  }
  return all;
}

const TABLE_SCHEMAS = {
  admin_roles: `CREATE TABLE IF NOT EXISTS admin_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TEXT,
    created_by TEXT
  )`,

  auction_bids: `CREATE TABLE IF NOT EXISTS auction_bids (
    id TEXT PRIMARY KEY,
    auction_id TEXT,
    bidder_id TEXT,
    amount REAL NOT NULL,
    is_automatic INTEGER,
    created_at TEXT
  )`,

  dns_records: `CREATE TABLE IF NOT EXISTS dns_records (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    subdomain TEXT NOT NULL,
    record_type TEXT NOT NULL,
    target TEXT NOT NULL,
    ttl INTEGER,
    priority INTEGER,
    status TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  domain_analytics: `CREATE TABLE IF NOT EXISTS domain_analytics (
    id TEXT PRIMARY KEY,
    domain_id TEXT,
    views INTEGER,
    favorites INTEGER,
    offers INTEGER,
    last_updated TEXT
  )`,

  domain_auctions: `CREATE TABLE IF NOT EXISTS domain_auctions (
    id TEXT PRIMARY KEY,
    domain_id TEXT,
    starting_price REAL NOT NULL,
    current_price REAL NOT NULL,
    reserve_price REAL,
    bid_increment REAL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT,
    winner_id TEXT,
    total_bids INTEGER,
    created_at TEXT,
    updated_at TEXT
  )`,

  domain_bulk_operations: `CREATE TABLE IF NOT EXISTS domain_bulk_operations (
    id TEXT PRIMARY KEY,
    operation_type TEXT NOT NULL,
    domain_ids TEXT NOT NULL,
    details TEXT,
    performed_by TEXT,
    created_at TEXT
  )`,

  domain_history: `CREATE TABLE IF NOT EXISTS domain_history (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    price_change REAL,
    performed_by TEXT,
    created_at TEXT
  )`,

  domain_listings: `CREATE TABLE IF NOT EXISTS domain_listings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    description TEXT,
    status TEXT,
    owner_id TEXT,
    is_verified INTEGER,
    verification_status TEXT,
    highlight INTEGER,
    currency TEXT,
    created_at TEXT
  )`,

  domain_monitoring: `CREATE TABLE IF NOT EXISTS domain_monitoring (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    domain_name TEXT NOT NULL,
    status TEXT NOT NULL,
    check_interval INTEGER,
    last_checked TEXT,
    notifications_enabled INTEGER,
    created_at TEXT,
    updated_at TEXT
  )`,

  domain_monitoring_history: `CREATE TABLE IF NOT EXISTS domain_monitoring_history (
    id TEXT PRIMARY KEY,
    monitoring_id TEXT NOT NULL,
    status_before TEXT,
    status_after TEXT,
    response_time INTEGER,
    error_message TEXT,
    checked_at TEXT
  )`,

  domain_offers: `CREATE TABLE IF NOT EXISTS domain_offers (
    id TEXT PRIMARY KEY,
    domain_id TEXT,
    buyer_id TEXT,
    seller_id TEXT,
    amount REAL NOT NULL,
    message TEXT,
    contact_email TEXT,
    status TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  domain_price_history: `CREATE TABLE IF NOT EXISTS domain_price_history (
    id TEXT PRIMARY KEY,
    domain_id TEXT,
    price REAL NOT NULL,
    previous_price REAL,
    changed_by TEXT,
    change_reason TEXT,
    created_at TEXT
  )`,

  domain_sale_settings: `CREATE TABLE IF NOT EXISTS domain_sale_settings (
    id TEXT PRIMARY KEY,
    domain_id TEXT,
    escrow_service INTEGER,
    installment_available INTEGER,
    installment_terms TEXT,
    payment_methods TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  domain_shares: `CREATE TABLE IF NOT EXISTS domain_shares (
    id TEXT PRIMARY KEY,
    domain_id TEXT,
    user_id TEXT,
    platform TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT
  )`,

  domain_valuations: `CREATE TABLE IF NOT EXISTS domain_valuations (
    id TEXT PRIMARY KEY,
    domain_name TEXT NOT NULL,
    estimated_value REAL NOT NULL,
    category TEXT,
    factors TEXT,
    created_at TEXT,
    expires_at TEXT
  )`,

  domain_verifications: `CREATE TABLE IF NOT EXISTS domain_verifications (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL,
    user_id TEXT,
    verification_type TEXT NOT NULL,
    verification_method TEXT,
    status TEXT NOT NULL,
    verification_data TEXT,
    verification_attempts INTEGER,
    expiry_date TEXT,
    last_checked TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  domains: `CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    description TEXT,
    status TEXT,
    owner_id TEXT,
    sale_type TEXT,
    buy_now_price REAL,
    minimum_offer REAL,
    minimum_price REAL,
    negotiable INTEGER,
    registrar TEXT,
    registration_date TEXT,
    expiry_date TEXT,
    is_featured INTEGER,
    featured_rank INTEGER,
    featured_until TEXT,
    keywords TEXT,
    meta_title TEXT,
    meta_description TEXT,
    traffic_stats TEXT,
    payment_plans TEXT,
    previous_sales TEXT,
    verification_status TEXT,
    last_verified_at TEXT,
    created_at TEXT
  )`,

  disputes: `CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    transaction_id TEXT,
    domain_id TEXT,
    initiator_id TEXT,
    respondent_id TEXT,
    reason TEXT NOT NULL,
    description TEXT,
    evidence_urls TEXT,
    status TEXT,
    admin_notes TEXT,
    resolved_by TEXT,
    resolved_at TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  email_templates: `CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    variables TEXT,
    is_active INTEGER,
    created_at TEXT,
    updated_at TEXT
  )`,

  escrow_services: `CREATE TABLE IF NOT EXISTS escrow_services (
    id TEXT PRIMARY KEY,
    transaction_id TEXT,
    escrow_provider TEXT,
    escrow_fee REAL,
    status TEXT,
    funded_at TEXT,
    released_at TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  languages: `CREATE TABLE IF NOT EXISTS languages (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    is_default INTEGER,
    created_at TEXT
  )`,

  messages: `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT,
    receiver_id TEXT,
    domain_id TEXT,
    offer_id TEXT,
    transaction_id TEXT,
    content TEXT NOT NULL,
    is_read INTEGER,
    created_at TEXT
  )`,

  notifications: `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    related_id TEXT,
    action_url TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  pages: `CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  payment_gateway_settings: `CREATE TABLE IF NOT EXISTS payment_gateway_settings (
    id TEXT PRIMARY KEY,
    gateway_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_enabled INTEGER,
    fee_rate REAL,
    min_amount REAL,
    max_amount REAL,
    supported_currencies TEXT,
    config TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  payment_methods: `CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT NOT NULL,
    provider_data TEXT NOT NULL,
    is_active INTEGER,
    is_default INTEGER,
    created_at TEXT,
    updated_at TEXT
  )`,

  payment_transactions: `CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    domain_id TEXT,
    gateway TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT,
    fee REAL,
    status TEXT,
    gateway_transaction_id TEXT,
    gateway_response TEXT,
    payment_url TEXT,
    buyer_note TEXT,
    metadata TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  profiles: `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    company_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    custom_url TEXT,
    is_seller INTEGER,
    seller_verified INTEGER,
    seller_rating REAL,
    total_sales INTEGER,
    balance REAL,
    verification_status TEXT,
    verification_documents TEXT,
    payment_info TEXT,
    preferred_payment_methods TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  referral_rewards: `CREATE TABLE IF NOT EXISTS referral_rewards (
    id TEXT PRIMARY KEY,
    referrer_id TEXT,
    referred_user_id TEXT,
    transaction_id TEXT,
    reward_type TEXT,
    reward_amount REAL,
    status TEXT,
    paid_at TEXT,
    created_at TEXT
  )`,

  site_content: `CREATE TABLE IF NOT EXISTS site_content (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    section TEXT,
    type TEXT,
    content TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  site_settings: `CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT,
    description TEXT,
    section TEXT,
    type TEXT,
    is_multilingual INTEGER,
    updated_at TEXT
  )`,

  smtp_settings: `CREATE TABLE IF NOT EXISTS smtp_settings (
    id TEXT PRIMARY KEY,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    from_email TEXT NOT NULL,
    from_name TEXT NOT NULL,
    enabled INTEGER,
    created_at TEXT,
    updated_at TEXT
  )`,

  transactions: `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL,
    buyer_id TEXT,
    seller_id TEXT,
    offer_id TEXT,
    amount REAL NOT NULL,
    commission_rate REAL,
    commission_amount REAL,
    seller_amount REAL,
    payment_method TEXT,
    payment_id TEXT,
    status TEXT NOT NULL,
    notes TEXT,
    buyer_confirmed_at TEXT,
    seller_confirmed_at TEXT,
    transfer_confirmed_buyer INTEGER,
    transfer_confirmed_seller INTEGER,
    completed_at TEXT,
    created_at TEXT,
    updated_at TEXT
  )`,

  translations: `CREATE TABLE IF NOT EXISTS translations (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    language_code TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT
  )`,

  user_activities: `CREATE TABLE IF NOT EXISTS user_activities (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    activity_type TEXT NOT NULL,
    resource_id TEXT,
    metadata TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT
  )`,

  user_favorites: `CREATE TABLE IF NOT EXISTS user_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    domain_id TEXT,
    created_at TEXT
  )`,

  user_reviews: `CREATE TABLE IF NOT EXISTS user_reviews (
    id TEXT PRIMARY KEY,
    reviewer_id TEXT,
    reviewed_user_id TEXT,
    transaction_id TEXT,
    rating REAL,
    comment TEXT,
    created_at TEXT
  )`,
};

async function insertBatch(table, rows) {
  if (!rows || rows.length === 0) return;
  const cols = Object.keys(rows[0]);
  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
  const stmts = rows.map(row => ({
    sql,
    args: cols.map(c => toSql(row[c])),
  }));
  await turso.batch(stmts, 'write');
}

async function migrate() {
  console.log('Starting migration: Supabase → Turso\n');
  const results = {};

  for (const [table, schemaSql] of Object.entries(TABLE_SCHEMAS)) {
    process.stdout.write(`Migrating ${table}... `);
    try {
      await turso.execute(schemaSql);
      const rows = await fetchAll(table);
      if (rows === null) { results[table] = 'skipped'; continue; }
      const CHUNK = 50;
      for (let i = 0; i < rows.length; i += CHUNK) {
        await insertBatch(table, rows.slice(i, i + CHUNK));
      }
      console.log(`✓ ${rows.length} rows`);
      results[table] = rows.length;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      results[table] = `error: ${err.message}`;
    }
  }

  console.log('\n=== Migration Summary ===');
  for (const [table, result] of Object.entries(results)) {
    const icon = typeof result === 'number' ? '✓' : result === 'skipped' ? '⚠' : '✗';
    console.log(`${icon} ${table}: ${result}`);
  }
  const migrated = Object.values(results).filter(v => typeof v === 'number').length;
  console.log(`\nDone: ${migrated}/${Object.keys(TABLE_SCHEMAS).length} tables migrated`);
}

migrate().catch(console.error);

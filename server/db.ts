import { createClient } from '@libsql/client';

const rawUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!rawUrl) throw new Error('TURSO_DATABASE_URL is required');
if (!authToken) throw new Error('TURSO_AUTH_TOKEN is required');

// Force HTTPS transport instead of WebSocket (libsql://) to avoid cold-start
// connection hangs in Vercel serverless. @libsql/client supports both.
const url = rawUrl.replace(/^libsql:\/\//, 'https://');

export const db = createClient({ url, authToken });

export async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS app_auth_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_verified INTEGER DEFAULT 1,
      reset_token TEXT,
      reset_token_expires TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      refresh_token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_feedback (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'other',
      subject TEXT,
      message TEXT NOT NULL,
      url TEXT,
      user_id TEXT,
      user_email TEXT,
      browser TEXT,
      screenshots TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      admin_note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      description TEXT,
      section TEXT NOT NULL DEFAULT 'general',
      type TEXT NOT NULL DEFAULT 'text',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS domain_listings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL,
      currency TEXT DEFAULT 'CNY',
      category TEXT,
      status TEXT DEFAULT 'available',
      owner_id TEXT,
      description TEXT,
      views INTEGER DEFAULT 0,
      logo_url TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS domain_analytics (
      id TEXT PRIMARY KEY,
      domain_id TEXT UNIQUE NOT NULL,
      views INTEGER DEFAULT 0,
      favorites INTEGER DEFAULT 0,
      offers INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS domain_offers (
      id TEXT PRIMARY KEY,
      domain_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      message TEXT,
      contact_email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      domain_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      offer_id TEXT,
      payment_method TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      status TEXT DEFAULT 'pending',
      type TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      offer_id TEXT,
      transaction_id TEXT,
      reporter_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      resolution TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

  `);
}

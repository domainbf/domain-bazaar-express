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
  `);
}

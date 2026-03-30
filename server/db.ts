import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => console.error('[pg] pool error:', err.message));

function convertPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

type SqlArg = string | number | boolean | null | undefined;

interface ExecuteOptions {
  sql: string;
  args?: SqlArg[];
}

interface ExecuteResult {
  rows: Record<string, unknown>[];
}

export const db = {
  async execute(options: ExecuteOptions | string): Promise<ExecuteResult> {
    let sql: string;
    let args: SqlArg[] = [];
    if (typeof options === 'string') {
      sql = options;
    } else {
      sql = options.sql;
      args = options.args || [];
    }
    const pgSql = convertPlaceholders(sql);
    const result = await pool.query(pgSql, args as unknown[]);
    return { rows: result.rows as Record<string, unknown>[] };
  },

  async executeMultiple(sql: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      for (const stmt of statements) {
        await client.query(stmt);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

export async function initDb() {
  await pool.query(`
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
  `);
}

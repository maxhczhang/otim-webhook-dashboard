import Database from 'better-sqlite3';
import path from 'path';

export interface WebhookEvent {
  id: string;
  type: string;
  created_at: string;
  data: string; // JSON string
  signature: string;
  verified: number; // 0 or 1 (SQLite boolean)
  received_at: string;
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'webhooks.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        data TEXT NOT NULL,
        signature TEXT NOT NULL DEFAULT '',
        verified INTEGER NOT NULL DEFAULT 1,
        received_at TEXT NOT NULL
      )
    `);
    // Migration: add columns if missing (for existing DBs)
    const cols = db.prepare("PRAGMA table_info(events)").all() as { name: string }[];
    const colNames = cols.map(c => c.name);
    if (!colNames.includes('signature')) {
      db.exec("ALTER TABLE events ADD COLUMN signature TEXT NOT NULL DEFAULT ''");
    }
    if (!colNames.includes('verified')) {
      db.exec("ALTER TABLE events ADD COLUMN verified INTEGER NOT NULL DEFAULT 1");
    }
  }
  return db;
}

export function insertEvent(event: {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
  signature?: string;
  verified?: boolean;
}): void {
  const stmt = getDb().prepare(
    'INSERT OR IGNORE INTO events (id, type, created_at, data, signature, verified, received_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(
    event.id,
    event.type,
    event.created_at,
    JSON.stringify(event.data),
    event.signature || '',
    event.verified !== false ? 1 : 0,
    new Date().toISOString()
  );
}

export function getEvents(limit = 50): WebhookEvent[] {
  return getDb().prepare(
    'SELECT * FROM events ORDER BY received_at DESC LIMIT ?'
  ).all(limit) as WebhookEvent[];
}

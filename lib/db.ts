import Database from 'better-sqlite3';
import path from 'path';

export interface WebhookEvent {
  id: string;
  type: string;
  created_at: string;
  data: string; // JSON string
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
        received_at TEXT NOT NULL
      )
    `);
  }
  return db;
}

export function insertEvent(event: { id: string; type: string; created_at: string; data: Record<string, unknown> }): void {
  const stmt = getDb().prepare(
    'INSERT OR IGNORE INTO events (id, type, created_at, data, received_at) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(event.id, event.type, event.created_at, JSON.stringify(event.data), new Date().toISOString());
}

export function getEvents(limit = 50): WebhookEvent[] {
  return getDb().prepare(
    'SELECT * FROM events ORDER BY received_at DESC LIMIT ?'
  ).all(limit) as WebhookEvent[];
}

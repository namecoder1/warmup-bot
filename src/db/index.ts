import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DB_PATH ?? path.resolve("warmup.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS replied_emails (
    message_id TEXT NOT NULL,
    alias      TEXT NOT NULL,
    replied_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (message_id, alias)
  )
`);

export function hasReplied(messageId: string, alias: string): boolean {
  const row = db.prepare(
    "SELECT 1 FROM replied_emails WHERE message_id = ? AND alias = ?"
  ).get(messageId, alias);
  return !!row;
}

// Ritorna true se il record è stato inserito (prima volta), false se esisteva già
export function markReplied(messageId: string, alias: string): boolean {
  const result = db.prepare(
    "INSERT OR IGNORE INTO replied_emails (message_id, alias) VALUES (?, ?)"
  ).run(messageId, alias);
  return result.changes > 0;
}

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.SQLITE_DB_PATH || './npmradar.db';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);

  console.error(`SQLite database initialized: ${DB_PATH}`);
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

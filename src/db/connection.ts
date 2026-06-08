import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use user's home directory for database storage (npm package best practice)
function getDataDir(): string {
  const dataDir = join(homedir(), '.npm-radar');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

const DB_PATH = process.env.SQLITE_DB_PATH || join(getDataDir(), 'npmradar.db');

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

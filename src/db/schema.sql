-- Lightweight schema for trending analysis only

-- Hot packages cache (Top 1000)
CREATE TABLE IF NOT EXISTS packages (
  name TEXT PRIMARY KEY,
  version TEXT,
  description TEXT,
  author TEXT,
  downloads INTEGER DEFAULT 0,
  quality REAL DEFAULT 0,
  popularity REAL DEFAULT 0,
  updated_at INTEGER
);

-- Daily snapshots for trend calculation
CREATE TABLE IF NOT EXISTS trending_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name TEXT NOT NULL,
  downloads INTEGER,
  snapshot_date TEXT,
  UNIQUE(package_name, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_date ON trending_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_package ON trending_snapshots(package_name);

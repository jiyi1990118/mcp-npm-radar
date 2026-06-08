import { getDatabase } from './connection.js';

export function savePackage(pkg: any) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO packages (name, version, description, author, downloads, quality, popularity, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    pkg.name,
    pkg.version,
    pkg.description,
    pkg.author,
    pkg.downloads || 0,
    pkg.quality || 0,
    pkg.popularity || 0,
    Date.now()
  );
}

export function getTrendingPackages(limit: number = 20) {
  const db = getDatabase();
  return db.prepare(`
    SELECT
      p.*,
      (SELECT downloads FROM trending_snapshots
       WHERE package_name = p.name
       ORDER BY snapshot_date DESC LIMIT 1) as prev_downloads
    FROM packages p
    ORDER BY (p.downloads - COALESCE(prev_downloads, 0)) DESC
    LIMIT ?
  `).all(limit);
}

export function saveSnapshot(packageName: string, downloads: number) {
  const db = getDatabase();
  const date = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT OR IGNORE INTO trending_snapshots (package_name, downloads, snapshot_date)
    VALUES (?, ?, ?)
  `).run(packageName, downloads, date);
}

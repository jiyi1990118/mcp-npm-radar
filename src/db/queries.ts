import { getDatabase } from './connection.js';
import { isCacheValid } from '../utils/cache-manager.js';
import { refreshTopPackages } from '../utils/data-refresher.js';

export function savePackage(pkg: any) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO packages
    (name, version, description, author, downloads, weekly_downloads, quality, popularity, maintenance, category, keywords, license, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    pkg.name,
    pkg.version,
    pkg.description,
    pkg.author,
    pkg.downloads || 0,
    pkg.weekly_downloads || 0,
    pkg.quality || 0,
    pkg.popularity || 0,
    pkg.maintenance || 0,
    pkg.category || null,
    pkg.keywords ? JSON.stringify(pkg.keywords) : null,
    pkg.license || null,
    pkg.created_at || null,
    Date.now()
  );
}

export async function getTopPackages(limit: number = 50) {
  if (!isCacheValid('top_packages')) {
    await refreshTopPackages();
  }

  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM packages
    ORDER BY downloads DESC
    LIMIT ?
  `).all(limit);
}

export async function getPackagesByCategory(category: string, limit: number = 50) {
  if (!isCacheValid('top_packages')) {
    await refreshTopPackages();
  }

  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM packages
    WHERE category = ?
    ORDER BY downloads DESC
    LIMIT ?
  `).all(category, limit);
}

export async function getTrendingPackages(limit: number = 20) {
  if (!isCacheValid('top_packages')) {
    await refreshTopPackages();
  }

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

export async function getPackagesByDateRange(startDate: number, endDate: number, limit: number = 50) {
  if (!isCacheValid('top_packages')) {
    await refreshTopPackages();
  }

  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM packages
    WHERE created_at BETWEEN ? AND ?
    ORDER BY downloads DESC
    LIMIT ?
  `).all(startDate, endDate, limit);
}

export async function getWeeklyHot(limit: number = 50) {
  if (!isCacheValid('top_packages')) {
    await refreshTopPackages();
  }

  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM packages
    ORDER BY weekly_downloads DESC
    LIMIT ?
  `).all(limit);
}

export function saveSnapshot(packageName: string, downloads: number, weeklyDownloads: number = 0) {
  const db = getDatabase();
  const date = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT OR IGNORE INTO trending_snapshots (package_name, downloads, weekly_downloads, snapshot_date)
    VALUES (?, ?, ?, ?)
  `).run(packageName, downloads, weeklyDownloads, date);
}

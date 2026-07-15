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

export function saveSnapshot(packageName: string, downloads: number, weeklyDownloads: number) {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT OR REPLACE INTO trending_snapshots
    (package_name, downloads, weekly_downloads, snapshot_date)
    VALUES (?, ?, ?, ?)
  `).run(packageName, downloads, weeklyDownloads, today);
}

export async function getTopPackages(limit: number = 50, forceRefresh: boolean = false) {
  if (forceRefresh || !isCacheValid('top_packages')) {
    await refreshTopPackages();
  }

  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM packages
    ORDER BY downloads DESC
    LIMIT ?
  `).all(limit);
}

export function getIndexedCount(): number {
  const db = getDatabase();
  const row = db.prepare(`SELECT COUNT(*) as count FROM packages`).get() as { count: number };
  return row.count;
}

export async function getPackagesByCategory(category: string, limit: number = 50, forceRefresh: boolean = false) {
  if (forceRefresh || !isCacheValid('top_packages')) {
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

export async function getTrendingPackages(limit: number = 20, forceRefresh: boolean = false) {
  if (forceRefresh || !isCacheValid('top_packages')) {
    await refreshTopPackages();
  }

  const db = getDatabase();

  // Check if snapshots exist
  const snapshotCount = db.prepare(`SELECT COUNT(*) as count FROM trending_snapshots`).get() as { count: number };

  if (snapshotCount.count === 0) {
    // Cold start: no historical data, use weekly downloads as proxy
    return db.prepare(`
      SELECT * FROM packages
      ORDER BY weekly_downloads DESC
      LIMIT ?
    `).all(limit);
  }

  // Normal case: calculate growth from snapshots
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

export async function getPackagesByDateRange(startDate: number, endDate: number, limit: number = 50, forceRefresh: boolean = false) {
  if (forceRefresh || !isCacheValid('top_packages')) {
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

export async function getWeeklyHot(limit: number = 50, forceRefresh: boolean = false) {
  if (forceRefresh || !isCacheValid('top_packages')) {
    await refreshTopPackages();
  }

  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM packages
    ORDER BY weekly_downloads DESC
    LIMIT ?
  `).all(limit);
}

export function cleanupOldData() {
  const db = getDatabase();
  const now = Date.now();

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const sevenDaysAgo = now - SEVEN_DAYS;
  const thirtyDaysAgo = now - THIRTY_DAYS;

  const packagesDeleted = db.prepare(`
    DELETE FROM packages
    WHERE updated_at < ?
  `).run(sevenDaysAgo).changes;

  const snapshotsDeleted = db.prepare(`
    DELETE FROM trending_snapshots
    WHERE snapshot_date < date('now', '-30 days')
  `).run().changes;

  console.error(`Cleaned up ${packagesDeleted} old packages and ${snapshotsDeleted} old snapshots`);

  return { packagesDeleted, snapshotsDeleted };
}

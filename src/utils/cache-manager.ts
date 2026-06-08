const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  lastUpdate: number;
  ttl: number;
}

const cacheMap = new Map<string, CacheEntry>();

export function setCacheTimestamp(key: string, ttl: number = CACHE_TTL) {
  cacheMap.set(key, {
    lastUpdate: Date.now(),
    ttl,
  });
}

export function isCacheValid(key: string): boolean {
  const entry = cacheMap.get(key);
  if (!entry) return false;
  return Date.now() - entry.lastUpdate < entry.ttl;
}

export function getCacheAge(key: string): number {
  const entry = cacheMap.get(key);
  if (!entry) return Infinity;
  return Date.now() - entry.lastUpdate;
}

export function clearCache(key?: string) {
  if (key) {
    cacheMap.delete(key);
  } else {
    cacheMap.clear();
  }
}

import axios from 'axios';
import { retryWithBackoff } from '../utils/retry.js';

const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 3600000; // 1 hour
const CACHE_MAX = 500;

function touchCache(key: string, entry: { data: any; expires: number }) {
  cache.delete(key);
  cache.set(key, entry);
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

export async function getDownloadHistory(packageName: string, period: 'last-day' | 'last-week' | 'last-month' | 'last-year' = 'last-month') {
  const cacheKey = `${packageName}:${period}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    const result = await retryWithBackoff(
      async () => {
        const { data } = await axios.get(
          `https://api.npmjs.org/downloads/range/${period}/${packageName}`,
          { timeout: 10000 }
        );
        return data;
      },
      { retries: 3, delay: 2000 }
    );

    const totalDownloads = result.downloads?.reduce((sum: number, day: any) => sum + day.downloads, 0) || 0;
    const avgDailyDownloads = result.downloads?.length > 0 ? Math.round(totalDownloads / result.downloads.length) : 0;

    const response = {
      package: packageName,
      period,
      totalDownloads,
      avgDailyDownloads,
      downloads: result.downloads || [],
      start: result.start,
      end: result.end,
    };

    touchCache(cacheKey, { data: response, expires: Date.now() + CACHE_TTL });
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch download history: ${(error as Error).message}`);
  }
}

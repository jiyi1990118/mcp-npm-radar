import axios from 'axios';

const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 3600000; // 1 hour

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0 || error.response?.status === 404) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

export async function getDownloadHistory(packageName: string, period: 'last-day' | 'last-week' | 'last-month' | 'last-year' = 'last-month') {
  const cacheKey = `${packageName}:${period}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    const result = await retryWithBackoff(async () => {
      const { data } = await axios.get(
        `https://api.npmjs.org/downloads/range/${period}/${packageName}`,
        { timeout: 10000 }
      );
      return data;
    });

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

    cache.set(cacheKey, { data: response, expires: Date.now() + CACHE_TTL });
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch download history: ${(error as Error).message}`);
  }
}

export async function compareDownloadTrends(packageNames: string[], period: 'last-week' | 'last-month' | 'last-year' = 'last-month') {
  const trends = [];
  const DELAY_BETWEEN_REQUESTS = 200;

  for (const name of packageNames) {
    try {
      const history = await getDownloadHistory(name, period);
      trends.push({
        package: name,
        totalDownloads: history.totalDownloads,
        avgDailyDownloads: history.avgDailyDownloads,
        trend: calculateTrend(history.downloads),
      });
    } catch {
      trends.push({
        package: name,
        error: 'Failed to fetch data',
      });
    }

    if (trends.length < packageNames.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }

  return trends;
}

function calculateTrend(downloads: any[]): string {
  if (!downloads || downloads.length < 2) return 'stable';

  const firstHalf = downloads.slice(0, Math.floor(downloads.length / 2));
  const secondHalf = downloads.slice(Math.floor(downloads.length / 2));

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.downloads, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.downloads, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (change > 10) return 'growing';
  if (change < -10) return 'declining';
  return 'stable';
}

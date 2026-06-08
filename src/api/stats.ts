import axios from 'axios';

export async function getDownloadHistory(packageName: string, period: 'last-day' | 'last-week' | 'last-month' | 'last-year' = 'last-month') {
  try {
    const { data } = await axios.get(
      `https://api.npmjs.org/downloads/range/${period}/${packageName}`,
      { timeout: 10000 }
    );

    const totalDownloads = data.downloads?.reduce((sum: number, day: any) => sum + day.downloads, 0) || 0;
    const avgDailyDownloads = data.downloads?.length > 0 ? Math.round(totalDownloads / data.downloads.length) : 0;

    return {
      package: packageName,
      period,
      totalDownloads,
      avgDailyDownloads,
      downloads: data.downloads || [],
      start: data.start,
      end: data.end,
    };
  } catch (error) {
    throw new Error(`Failed to fetch download history: ${(error as Error).message}`);
  }
}

export async function compareDownloadTrends(packageNames: string[], period: 'last-week' | 'last-month' | 'last-year' = 'last-month') {
  const trends = await Promise.all(
    packageNames.map(async (name) => {
      try {
        const history = await getDownloadHistory(name, period);
        return {
          package: name,
          totalDownloads: history.totalDownloads,
          avgDailyDownloads: history.avgDailyDownloads,
          trend: calculateTrend(history.downloads),
        };
      } catch {
        return {
          package: name,
          error: 'Failed to fetch data',
        };
      }
    })
  );

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

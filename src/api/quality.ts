import { getPackageInfo } from './npm.js';
import { getDownloadHistory } from './stats.js';

export async function getPackageQualityScore(packageName: string) {
  try {
    const info = await getPackageInfo(packageName);
    const latest = info['dist-tags']?.latest;
    const latestVersion = info.versions?.[latest];
    const downloads = await getDownloadHistory(packageName, 'last-month');

    // Calculate scores
    const popularityScore = calculatePopularityScore(downloads.totalDownloads);
    const maintenanceScore = calculateMaintenanceScore(info.time?.[latest]);
    const qualityScore = calculateQualityScore(info, latestVersion);

    const overallScore = Math.round((popularityScore + maintenanceScore + qualityScore) / 3);

    return {
      package: packageName,
      version: latest,
      overallScore,
      scores: {
        popularity: popularityScore,
        maintenance: maintenanceScore,
        quality: qualityScore,
      },
      details: {
        monthlyDownloads: downloads.totalDownloads,
        lastPublish: info.time?.[latest],
        hasReadme: !!info.readme,
        hasLicense: !!latestVersion?.license,
        hasRepository: !!info.repository,
        dependencyCount: Object.keys(latestVersion?.dependencies || {}).length,
        maintainerCount: info.maintainers?.length || 0,
      },
      rating: getRating(overallScore),
    };
  } catch (error) {
    throw new Error(`Failed to calculate quality score: ${(error as Error).message}`);
  }
}

function calculatePopularityScore(monthlyDownloads: number): number {
  if (monthlyDownloads > 10000000) return 100;
  if (monthlyDownloads > 1000000) return 90;
  if (monthlyDownloads > 100000) return 80;
  if (monthlyDownloads > 10000) return 70;
  if (monthlyDownloads > 1000) return 60;
  return 50;
}

function calculateMaintenanceScore(lastPublish?: string): number {
  if (!lastPublish) return 50;

  const daysSinceUpdate = (Date.now() - new Date(lastPublish).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate < 30) return 100;
  if (daysSinceUpdate < 90) return 90;
  if (daysSinceUpdate < 180) return 80;
  if (daysSinceUpdate < 365) return 70;
  if (daysSinceUpdate < 730) return 60;
  return 50;
}

function calculateQualityScore(info: any, version: any): number {
  let score = 50;

  if (info.readme) score += 10;
  if (version?.license) score += 10;
  if (info.repository) score += 10;
  if (info.homepage) score += 5;
  if (info.keywords && info.keywords.length > 3) score += 5;
  if (info.maintainers && info.maintainers.length > 1) score += 10;

  return Math.min(score, 100);
}

function getRating(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Poor';
}

import axios from 'axios';
import { getSelectedRegistry } from '../utils/registry-selector.js';
import { getPackageInfo } from './npm.js';

export async function comparePackages(packageNames: string[]) {
  const comparisons = await Promise.all(
    packageNames.map(async (name) => {
      try {
        const info = await getPackageInfo(name);
        const downloads = await getWeeklyDownloads(name);
        const latest = info['dist-tags']?.latest;
        const latestVersion = info.versions?.[latest];

        return {
          name: info.name,
          version: latest,
          description: info.description,
          license: latestVersion?.license || info.license,
          weeklyDownloads: downloads,
          dependencyCount: Object.keys(latestVersion?.dependencies || {}).length,
          lastPublish: info.time?.[latest],
          repositoryUrl: info.repository?.url,
          maintainers: info.maintainers?.length || 0,
        };
      } catch (error) {
        return {
          name,
          error: 'Package not found or unavailable',
        };
      }
    })
  );

  return comparisons;
}

async function getWeeklyDownloads(packageName: string): Promise<number> {
  try {
    const { data } = await axios.get(
      `https://api.npmjs.org/downloads/point/last-week/${packageName}`,
      { timeout: 5000 }
    );
    return data.downloads || 0;
  } catch {
    return 0;
  }
}

export async function getBundleSize(packageName: string, version?: string) {
  try {
    const pkg = version ? `${packageName}@${version}` : packageName;
    const { data } = await axios.get(
      `https://bundlephobia.com/api/size?package=${encodeURIComponent(pkg)}`,
      { timeout: 10000 }
    );

    return {
      name: data.name,
      version: data.version,
      size: data.size,
      gzip: data.gzip,
      dependencyCount: data.dependencyCount,
    };
  } catch (error) {
    throw new Error(`Failed to fetch bundle size: ${(error as Error).message}`);
  }
}

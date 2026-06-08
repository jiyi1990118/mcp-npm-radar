import axios from 'axios';
import { getSelectedRegistry } from './registry-selector.js';
import { savePackage } from '../db/queries.js';
import { setCacheTimestamp } from './cache-manager.js';

const POPULAR_PACKAGES = [
  'react', 'vue', 'angular', 'express', 'next', 'axios', 'lodash', 'typescript',
  'webpack', 'vite', 'eslint', 'prettier', 'jest', 'tailwindcss', 'prisma',
];

export async function refreshTopPackages() {
  console.error('Refreshing top packages data...');
  const registry = await getSelectedRegistry();

  for (const pkgName of POPULAR_PACKAGES) {
    try {
      const { data } = await axios.get(`${registry}/${pkgName}`, { timeout: 5000 });
      const latest = data['dist-tags']?.latest;
      const downloads = await getDownloads(pkgName);

      savePackage({
        name: data.name,
        version: latest,
        description: data.description,
        author: data.author?.name || data.maintainers?.[0]?.name,
        downloads: downloads.total,
        weekly_downloads: downloads.weekly,
        quality: 0.8,
        popularity: 0.7,
        maintenance: 0.9,
        category: inferCategory(data.keywords),
        keywords: data.keywords,
        license: data.license,
        created_at: new Date(data.time?.created).getTime(),
      });
    } catch (err) {
      console.error(`Failed to fetch ${pkgName}:`, (err as Error).message);
    }
  }

  setCacheTimestamp('top_packages');
  console.error('Top packages data refreshed');
}

async function getDownloads(packageName: string): Promise<{ total: number; weekly: number }> {
  try {
    const { data } = await axios.get(
      `https://api.npmjs.org/downloads/point/last-week/${packageName}`,
      { timeout: 5000 }
    );
    return { total: data.downloads * 10, weekly: data.downloads };
  } catch {
    return { total: 0, weekly: 0 };
  }
}

function inferCategory(keywords?: string[]): string | null {
  if (!keywords) return null;
  if (keywords.some(k => ['react', 'vue', 'angular'].includes(k))) return 'web-framework';
  if (keywords.some(k => ['cli', 'command'].includes(k))) return 'cli-tool';
  if (keywords.some(k => ['database', 'db'].includes(k))) return 'database';
  return null;
}

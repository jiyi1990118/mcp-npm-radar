import axios from 'axios';
import { getPackageInfo } from './npm.js';

export async function getRelatedPackages(packageName: string, limit: number = 10, forceRefresh: boolean = false) {
  try {
    const info = await getPackageInfo(packageName, forceRefresh);
    const keywords = info.keywords || [];

    // 基于关键词搜索相关包
    const relatedByKeywords = await searchByKeywords(keywords, limit);

    // 基于依赖关系查找
    const latest = info['dist-tags']?.latest;
    const latestVersion = info.versions?.[latest];
    const dependencies = Object.keys(latestVersion?.dependencies || {});

    return {
      package: packageName,
      relatedPackages: relatedByKeywords,
      commonDependencies: dependencies.slice(0, 10),
      keywords,
    };
  } catch (error) {
    return {
      package: packageName,
      relatedPackages: [],
      commonDependencies: [],
      keywords: [],
      error: 'Unable to find related packages',
    };
  }
}

async function searchByKeywords(keywords: string[], limit: number) {
  if (!keywords || keywords.length === 0) return [];

  try {
    const searchTerm = keywords.slice(0, 3).join(' ');
    const { data } = await axios.get(
      `https://registry.npmjs.org/-/v1/search`,
      {
        params: {
          text: searchTerm,
          size: limit,
        },
        timeout: 10000,
      }
    );

    return data.objects?.map((obj: any) => ({
      name: obj.package.name,
      description: obj.package.description,
      version: obj.package.version,
      score: obj.score?.final,
    })) || [];
  } catch {
    return [];
  }
}

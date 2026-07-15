import { getPackageInfo } from './npm.js';
import { localizeImagesInMarkdown } from '../utils/image-downloader.js';

export async function getPackageReadme(packageName: string, forceRefresh: boolean = false) {
  try {
    const info = await getPackageInfo(packageName, forceRefresh);
    const latest = info['dist-tags']?.latest;

    const rawReadme = info.readme || 'No README available';
    const { content, images } = await localizeImagesInMarkdown(rawReadme, packageName);

    return {
      package: packageName,
      version: latest,
      readme: content,
      hasReadme: !!info.readme,
      images,
      repository: info.repository?.url,
      homepage: info.homepage,
    };
  } catch (error) {
    throw new Error(`Failed to fetch README: ${(error as Error).message}`);
  }
}

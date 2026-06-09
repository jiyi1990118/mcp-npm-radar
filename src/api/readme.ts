import { getPackageInfo } from './npm.js';

export async function getPackageReadme(packageName: string) {
  try {
    const info = await getPackageInfo(packageName);
    const latest = info['dist-tags']?.latest;

    return {
      package: packageName,
      version: latest,
      readme: info.readme || 'No README available',
      hasReadme: !!info.readme,
      repository: info.repository?.url,
      homepage: info.homepage,
    };
  } catch (error) {
    throw new Error(`Failed to fetch README: ${(error as Error).message}`);
  }
}

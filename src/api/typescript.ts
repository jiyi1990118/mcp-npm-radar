import axios from 'axios';
import { getPackageInfo } from './npm.js';

export async function checkTypescriptSupport(packageName: string, forceRefresh: boolean = false) {
  try {
    const info = await getPackageInfo(packageName, forceRefresh);
    const latest = info['dist-tags']?.latest;
    const latestVersion = info.versions?.[latest];

    // Check if package has built-in types
    const hasBuiltInTypes = !!(
      latestVersion?.types ||
      latestVersion?.typings ||
      info.types ||
      info.typings
    );

    // Check if @types package exists
    const typesPackageName = `@types/${packageName.replace('@', '').replace('/', '__')}`;
    let hasDefinitelyTyped = false;
    let typesPackageVersion = null;

    try {
      const typesInfo = await getPackageInfo(typesPackageName, forceRefresh);
      hasDefinitelyTyped = true;
      typesPackageVersion = typesInfo['dist-tags']?.latest;
    } catch {
      // @types package doesn't exist
    }

    return {
      package: packageName,
      version: latest,
      typescriptSupport: hasBuiltInTypes || hasDefinitelyTyped,
      builtInTypes: hasBuiltInTypes,
      definitelyTyped: hasDefinitelyTyped,
      typesPackage: hasDefinitelyTyped ? typesPackageName : null,
      typesVersion: typesPackageVersion,
      recommendation: getRecommendation(hasBuiltInTypes, hasDefinitelyTyped),
    };
  } catch (error) {
    throw new Error(`Failed to check TypeScript support: ${(error as Error).message}`);
  }
}

function getRecommendation(builtIn: boolean, dt: boolean): string {
  if (builtIn) return 'Has built-in TypeScript types - ready to use';
  if (dt) return 'Install @types package for TypeScript support';
  return 'No TypeScript support available';
}

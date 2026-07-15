import axios from 'axios';
import { getPackageInfo, searchPackages } from './npm.js';

export async function getPackageVulnerabilities(packageName: string, version?: string) {
  try {
    const pkg = version ? `${packageName}@${version}` : packageName;

    const { data: advisories } = await axios.post(
      'https://registry.npmjs.org/-/npm/v1/security/advisories/bulk',
      {
        [packageName]: version ? [version] : ['*'],
      },
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const vulns = advisories[packageName] || [];

    return {
      packageName,
      version: version || 'latest',
      checked: true,
      vulnerabilityCount: vulns.length,
      vulnerabilities: vulns.map((vuln: any) => ({
        id: vuln.id,
        title: vuln.title,
        severity: vuln.severity,
        url: vuln.url,
        vulnerable_versions: vuln.vulnerable_versions,
        patched_versions: vuln.patched_versions,
      })),
    };
  } catch (error) {
    return {
      packageName,
      version: version || 'latest',
      checked: false,
      vulnerabilityCount: 0,
      vulnerabilities: [],
      note: 'Unable to fetch vulnerability data - the result below must NOT be interpreted as "no vulnerabilities". Retry or check npm advisories manually.',
    };
  }
}

export async function findAlternatives(packageName: string, forceRefresh: boolean = false) {
  try {
    const info = await getPackageInfo(packageName, forceRefresh);
    const keywords = info.keywords || [];

    let term: string;
    if (keywords.length > 0) {
      term = keywords.slice(0, 3).join(' ');
    } else {
      term = packageName.replace(/^@[^/]+\//, '');
    }

    const results = await searchPackages(term, 10, forceRefresh);
    const alternatives = (results.objects || [])
      .filter((obj: any) => obj.package.name !== packageName)
      .map((obj: any) => ({
        name: obj.package.name,
        description: obj.package.description,
        version: obj.package.version,
        score: obj.score?.final,
      }));

    return {
      original: packageName,
      keywords,
      alternatives,
    };
  } catch (error) {
    return {
      original: packageName,
      keywords: [],
      alternatives: [],
      note: 'Unable to find alternatives',
    };
  }
}

import axios from 'axios';

export async function getPackageVulnerabilities(packageName: string, version?: string) {
  try {
    const pkg = version ? `${packageName}@${version}` : packageName;

    // 使用 npm registry API 获取包信息，然后查询已知漏洞
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
    // 如果API失败，返回基本信息
    return {
      packageName,
      version: version || 'latest',
      vulnerabilityCount: 0,
      vulnerabilities: [],
      note: 'Unable to fetch vulnerability data',
    };
  }
}

export async function findAlternatives(packageName: string) {
  try {
    // 搜索类似功能的包
    const { data: searchResults } = await axios.get(
      `https://registry.npmjs.org/-/v1/search`,
      {
        params: {
          text: `keywords:${packageName}-alternative`,
          size: 10,
        },
        timeout: 10000,
      }
    );

    const alternatives = searchResults.objects?.map((obj: any) => ({
      name: obj.package.name,
      description: obj.package.description,
      version: obj.package.version,
      score: obj.score.final,
    })) || [];

    return {
      original: packageName,
      alternatives,
    };
  } catch (error) {
    return {
      original: packageName,
      alternatives: [],
      note: 'Unable to find alternatives',
    };
  }
}

import axios from 'axios';

export const NPM_REGISTRIES = [
  { name: 'npm', url: 'https://registry.npmjs.org' },
  { name: 'npmmirror', url: 'https://registry.npmmirror.com' },
  { name: 'tencent', url: 'https://mirrors.cloud.tencent.com/npm' },
  { name: 'huawei', url: 'https://mirrors.huaweicloud.com/repository/npm' },
];

let selectedRegistry: string | null = null;
let lastCheckTime: number = 0;
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

async function checkRegistry(url: string, timeout: number = 3000): Promise<number> {
  const start = Date.now();
  try {
    await axios.get(`${url}/axios`, { timeout });
    return Date.now() - start;
  } catch {
    return Infinity;
  }
}

export async function selectFastestRegistry(): Promise<string> {
  console.error('Checking npm registries...');

  const results = await Promise.all(
    NPM_REGISTRIES.map(async (registry) => ({
      url: registry.url,
      name: registry.name,
      latency: await checkRegistry(registry.url),
    }))
  );

  const fastest = results
    .filter(r => r.latency < Infinity)
    .sort((a, b) => a.latency - b.latency)[0];

  if (fastest) {
    selectedRegistry = fastest.url;
    lastCheckTime = Date.now();
    console.error(`Selected ${fastest.name} registry (${fastest.latency}ms)`);
    return fastest.url;
  }

  selectedRegistry = NPM_REGISTRIES[0].url;
  lastCheckTime = Date.now();
  console.error('Using default npm registry');
  return selectedRegistry;
}

export async function getSelectedRegistry(): Promise<string> {
  const now = Date.now();
  const shouldRecheck = !selectedRegistry || (now - lastCheckTime) > CHECK_INTERVAL;

  if (shouldRecheck) {
    console.error('Registry check interval exceeded, reselecting...');
    return await selectFastestRegistry();
  }

  return selectedRegistry!;
}

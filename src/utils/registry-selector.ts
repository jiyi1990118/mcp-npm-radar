import axios from 'axios';

export const NPM_REGISTRIES = [
  { name: 'npm', url: 'https://registry.npmjs.org' },
  { name: 'npmmirror', url: 'https://registry.npmmirror.com' },
  { name: 'tencent', url: 'https://mirrors.cloud.tencent.com/npm' },
  { name: 'huawei', url: 'https://mirrors.huaweicloud.com/repository/npm' },
];

const PROBE_PATH = '/-/ping';

export interface RegistryStatus {
  name: string;
  url: string;
  latency: number;
  ok: boolean;
}

let selectedRegistry: string | null = null;
let lastCheckTime: number = 0;
let lastStatuses: RegistryStatus[] = [];
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

async function probeRegistry(url: string, timeout: number = 3000): Promise<number> {
  const start = Date.now();
  try {
    await axios.get(`${url}${PROBE_PATH}`, { timeout, maxRedirects: 3 });
    return Date.now() - start;
  } catch {
    return -1;
  }
}

export async function checkAllRegistries(): Promise<RegistryStatus[]> {
  const results = await Promise.all(
    NPM_REGISTRIES.map(async (registry) => {
      const latency = await probeRegistry(registry.url);
      return {
        name: registry.name,
        url: registry.url,
        latency: latency < 0 ? Infinity : latency,
        ok: latency >= 0,
      };
    })
  );
  lastStatuses = results;
  return results;
}

export function getLastRegistryStatuses(): RegistryStatus[] {
  return lastStatuses;
}

export async function selectFastestRegistry(): Promise<string> {
  console.error('Checking npm registries...');

  const results = await checkAllRegistries();

  const fastest = results
    .filter((r) => r.ok)
    .sort((a, b) => a.latency - b.latency)[0];

  const summary = results.map((r) => `${r.name}=${r.ok ? r.latency + 'ms' : 'down'}`).join(', ');
  console.error(`Registry probe: ${summary}`);

  if (fastest) {
    selectedRegistry = fastest.url;
    lastCheckTime = Date.now();
    console.error(`Selected ${fastest.name} registry (${fastest.latency}ms)`);
    return fastest.url;
  }

  selectedRegistry = NPM_REGISTRIES[0].url;
  lastCheckTime = Date.now();
  console.error(`All registries unreachable, falling back to ${NPM_REGISTRIES[0].name}`);
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

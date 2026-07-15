import axios from 'axios';
import { getSelectedRegistry } from '../utils/registry-selector.js';

// Search is an npm-native API feature; mirror implementations are inconsistent
// (huawei returns 0 results, npmmirror omits `score`). Always use official npm.
const SEARCH_REGISTRY = 'https://registry.npmjs.org';

const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 3600000; // 1 hour
const CACHE_MAX = 500;

async function getCached<T>(key: string, fetcher: () => Promise<T>, forceRefresh: boolean = false): Promise<T> {
  if (!forceRefresh) {
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
  }

  const data = await fetcher();
  cache.delete(key);
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  return data;
}

export async function searchPackages(keyword: string, limit: number = 20, forceRefresh: boolean = false) {
  return getCached(`search:${keyword}:${limit}`, async () => {
    const { data } = await axios.get(`${SEARCH_REGISTRY}/-/v1/search`, {
      params: { text: keyword, size: limit },
      timeout: 10000,
    });
    return data;
  }, forceRefresh);
}

export async function getPackageInfo(packageName: string, forceRefresh: boolean = false) {
  const registry = await getSelectedRegistry();

  return getCached(`package:${packageName}`, async () => {
    const { data } = await axios.get(`${registry}/${packageName}`, {
      timeout: 10000,
    });
    return data;
  }, forceRefresh);
}

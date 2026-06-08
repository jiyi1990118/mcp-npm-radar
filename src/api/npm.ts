import axios from 'axios';
import { selectFastestRegistry, getSelectedRegistry } from '../utils/registry-selector.js';

const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 3600000; // 1 hour

async function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  const data = await fetcher();
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
  return data;
}

export async function searchPackages(keyword: string, limit: number = 20) {
  const registry = await getSelectedRegistry();

  return getCached(`search:${keyword}:${limit}`, async () => {
    const { data } = await axios.get(`${registry}/-/v1/search`, {
      params: { text: keyword, size: limit },
      timeout: 10000,
    });
    return data;
  });
}

export async function getPackageInfo(packageName: string) {
  const registry = await getSelectedRegistry();

  return getCached(`package:${packageName}`, async () => {
    const { data } = await axios.get(`${registry}/${packageName}`, {
      timeout: 10000,
    });
    return data;
  });
}

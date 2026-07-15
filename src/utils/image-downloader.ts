import axios from 'axios';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { homedir } from 'os';

const DEFAULT_CONCURRENCY = Math.max(1, parseInt(process.env.NPM_RADAR_IMAGE_CONCURRENCY || '8', 10));
const DEFAULT_TIMEOUT_MS = Math.max(1000, parseInt(process.env.NPM_RADAR_IMAGE_TIMEOUT_MS || '15000', 10));
const DEFAULT_RETRIES = 2;

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'];

// !alt
const MD_IMG_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
// <img src="url">
const HTML_IMG_RE = /<img[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;

export interface ImageResult {
  originalUrl: string;
  localPath: string | null;
  status: 'ok' | 'failed' | 'skipped';
  reason?: string;
  alt?: string;
}

export interface LocalizeResult {
  content: string;
  images: ImageResult[];
}

function getImageBaseDir(): string {
  return process.env.NPM_RADAR_IMAGE_DIR || join(homedir(), '.npm-radar', 'images');
}

function sanitizePkg(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'unknown';
}

function inferExt(url: string, contentType: string): string {
  try {
    const fromUrl = extname(new URL(url).pathname).toLowerCase();
    if (IMAGE_EXTS.includes(fromUrl)) return fromUrl;
  } catch {
    // ignore parse errors
  }
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('png')) return '.png';
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg';
  if (ct.includes('gif')) return '.gif';
  if (ct.includes('webp')) return '.webp';
  if (ct.includes('svg')) return '.svg';
  if (ct.includes('bmp')) return '.bmp';
  if (ct.includes('x-icon')) return '.ico';
  return '.png';
}

function findExisting(pkgDir: string, hash: string): string | null {
  if (!existsSync(pkgDir)) return null;
  try {
    const hit = readdirSync(pkgDir).find((f) => f.startsWith(hash + '.'));
    return hit ? join(pkgDir, hit) : null;
  } catch {
    return null;
  }
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries: number, delay: number): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries <= 0 || err?.response?.status === 404) throw err;
    await new Promise((r) => setTimeout(r, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

async function downloadImage(
  url: string,
  pkgDir: string,
  timeoutMs: number,
  retries: number
): Promise<{ localPath?: string; status: 'ok' | 'failed'; reason?: string }> {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 16);

  const existing = findExisting(pkgDir, hash);
  if (existing) return { localPath: existing, status: 'ok' };

  try {
    const res = await retryWithBackoff(
      () => axios.get(url, { timeout: timeoutMs, responseType: 'arraybuffer', maxRedirects: 5 }),
      retries,
      500
    );
    const ext = inferExt(url, String(res.headers['content-type'] || ''));
    const localPath = join(pkgDir, `${hash}${ext}`);
    if (!existsSync(localPath)) writeFileSync(localPath, Buffer.from(res.data));
    return { localPath, status: 'ok' };
  } catch (err: any) {
    return { status: 'failed', reason: err?.message || String(err) };
  }
}

async function pool<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

function buildReplacement(alt: string, url: string, ir: ImageResult | undefined): string {
  if (!ir) return `![${alt}](${url})`;
  if (ir.status === 'ok' && ir.localPath) {
    const meta = JSON.stringify({ path: ir.localPath, orig: url, status: 'ok', alt });
    return `![${alt}](file://${ir.localPath})<!--IMG ${meta}-->`;
  }
  const meta = JSON.stringify({ path: null, orig: url, status: ir.status, reason: ir.reason, alt });
  return `<!--IMG ${meta}-->`;
}

export async function localizeImagesInMarkdown(markdown: string, packageName: string): Promise<LocalizeResult> {
  if (!markdown) return { content: markdown || '', images: [] };

  const pkgDir = join(getImageBaseDir(), sanitizePkg(packageName));
  mkdirSync(pkgDir, { recursive: true });

  const mdTasks = [...markdown.matchAll(MD_IMG_RE)].map((m) => ({ alt: m[1], url: m[2] }));
  const htmlTasks = [...markdown.matchAll(HTML_IMG_RE)].map((m) => ({ alt: '', url: m[1] }));
  const deduped = [...new Map([...mdTasks, ...htmlTasks].map((t) => [t.url, t])).values()];

  const downloadable = deduped.filter((t) => /^https?:\/\//i.test(t.url));
  const results = new Map<string, ImageResult>();

  // Parallel download; resolves only after every image settles (ok/failed).
  await pool(downloadable, DEFAULT_CONCURRENCY, async (task) => {
    const r = await downloadImage(task.url, pkgDir, DEFAULT_TIMEOUT_MS, DEFAULT_RETRIES);
    const ir: ImageResult = {
      originalUrl: task.url,
      localPath: r.localPath || null,
      status: r.status,
      reason: r.reason,
      alt: task.alt,
    };
    results.set(task.url, ir);
    return ir;
  });

  for (const t of deduped) {
    if (!/^https?:\/\//i.test(t.url)) {
      results.set(t.url, { originalUrl: t.url, localPath: null, status: 'skipped', alt: t.alt });
    }
  }

  let content = markdown.replace(MD_IMG_RE, (full, alt, url) => buildReplacement(alt, url, results.get(url)));
  content = content.replace(HTML_IMG_RE, (full, url) => buildReplacement('', url, results.get(url)));

  return { content, images: [...results.values()] };
}

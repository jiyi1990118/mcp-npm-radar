import axios from 'axios';
import { getSelectedRegistry } from './registry-selector.js';
import { retryWithBackoff } from './retry.js';
import { savePackage, saveSnapshot, cleanupOldData } from '../db/queries.js';
import { setCacheTimestamp } from './cache-manager.js';
import { getNpmScores } from '../api/quality.js';

const POPULAR_PACKAGES = [
  // Frameworks & Libraries
  'react', 'vue', 'angular', 'svelte', 'solid-js', 'preact', 'lit',
  'next', 'nuxt', 'gatsby', 'remix', 'astro', 'sveltekit',
  'express', 'fastify', 'koa', 'hapi', 'nestjs',

  // UI Libraries & Components
  'tailwindcss', 'bootstrap', 'material-ui', '@mui/material', 'antd', 'chakra-ui',
  'styled-components', 'emotion', 'sass', 'less', 'postcss',

  // State Management
  'redux', 'mobx', 'zustand', 'jotai', 'recoil', 'pinia', 'vuex',

  // Build Tools & Bundlers
  'webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'turbopack', 'swc',
  'babel', '@babel/core', '@babel/preset-env',

  // Testing
  'jest', 'vitest', 'mocha', 'chai', 'jasmine', 'cypress', 'playwright',
  '@testing-library/react', '@testing-library/vue', 'puppeteer',

  // Linting & Formatting
  'eslint', 'prettier', 'stylelint', 'commitlint', 'husky', 'lint-staged',

  // TypeScript & Types
  'typescript', '@types/node', '@types/react', '@types/express',

  // HTTP & API
  'axios', 'fetch', 'node-fetch', 'got', 'superagent', 'ky',
  'graphql', 'apollo-server', 'apollo-client', '@apollo/client',

  // Database & ORM
  'prisma', 'typeorm', 'sequelize', 'mongoose', 'knex', 'drizzle-orm',

  // Utilities
  'lodash', 'underscore', 'ramda', 'date-fns', 'dayjs', 'moment',
  'uuid', 'nanoid', 'validator', 'zod', 'yup', 'joi',

  // CLI & Tools
  'commander', 'yargs', 'inquirer', 'chalk', 'ora', 'boxen',
  'dotenv', 'cross-env', 'nodemon', 'concurrently',

  // Node.js Core
  'fs-extra', 'path', 'rimraf', 'glob', 'minimatch',

  // React Ecosystem
  'react-dom', 'react-router-dom', 'react-hook-form', 'formik',
  'react-query', '@tanstack/react-query',

  // Vue Ecosystem
  'vue-router', 'vueuse',
];

export interface RefreshResult {
  success: number;
  failed: number;
  total: number;
  error?: string;
}

export async function refreshTopPackages(): Promise<RefreshResult> {
  console.error('Refreshing top packages data...');

  let registry: string;
  try {
    registry = await getSelectedRegistry();
  } catch (err: any) {
    const msg = `Registry selection failed: ${err?.message || err}`;
    console.error(`[REFRESH_ABORTED] ${msg}`);
    setCacheTimestamp('top_packages');
    return { success: 0, failed: 0, total: POPULAR_PACKAGES.length, error: msg };
  }

  let successCount = 0;
  let failCount = 0;

  const BATCH_SIZE = 15;
  const BATCH_DELAY_MS = 500;

  for (let i = 0; i < POPULAR_PACKAGES.length; i += BATCH_SIZE) {
    const batch = POPULAR_PACKAGES.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (pkgName) => {
        try {
          const { data } = await retryWithBackoff(() =>
            axios.get(`${registry}/${pkgName}`, { timeout: 5000 })
          );

          const latest = data['dist-tags']?.latest;
          const [downloads, scores] = await Promise.all([
            getDownloads(pkgName),
            getNpmScores(pkgName),
          ]);

          savePackage({
            name: data.name,
            version: latest,
            description: data.description,
            author: data.author?.name || data.maintainers?.[0]?.name,
            downloads: downloads.monthly,
            weekly_downloads: downloads.weekly,
            quality: scores?.quality ?? 0.5,
            popularity: scores?.popularity ?? 0.5,
            maintenance: scores?.maintenance ?? 0.5,
            category: inferCategory(data.keywords),
            keywords: data.keywords,
            license: data.license,
            created_at: new Date(data.time?.created).getTime(),
          });

          saveSnapshot(data.name, downloads.monthly, downloads.weekly);
          successCount++;
        } catch (err: any) {
          failCount++;
          const errorType = err.response?.status === 404 ? 'NOT_FOUND' : 'NETWORK_ERROR';
          console.error(`[${errorType}] Failed to fetch ${pkgName}:`, err.message);
        }
      })
    );

    if (i + BATCH_SIZE < POPULAR_PACKAGES.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  cleanupOldData();
  setCacheTimestamp('top_packages');
  console.error(`Top packages refreshed: ${successCount} succeeded, ${failCount} failed`);
  return { success: successCount, failed: failCount, total: POPULAR_PACKAGES.length };
}

async function getDownloads(packageName: string): Promise<{ monthly: number; weekly: number }> {
  try {
    const [monthlyRes, weeklyRes] = await Promise.all([
      axios.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`, { timeout: 5000 }),
      axios.get(`https://api.npmjs.org/downloads/point/last-week/${packageName}`, { timeout: 5000 }),
    ]);
    return { monthly: monthlyRes.data.downloads, weekly: weeklyRes.data.downloads };
  } catch {
    return { monthly: 0, weekly: 0 };
  }
}

export function inferCategory(keywords?: string[]): string | null {
  if (!keywords || keywords.length === 0) return null;

  const kw = keywords.map(k => k.toLowerCase());

  const signals: Array<[string, string[]]> = [
    ['types', ['types', '@types', 'typings', 'dts']],
    ['css-in-js', ['styled-components', 'emotion', 'css-in-js', 'cssinjs']],
    ['web-framework', ['react', 'reactjs', 'vue', 'vuejs', 'angular', 'svelte', 'solid', 'solidjs', 'preact', 'lit', 'hyperapp']],
    ['meta-framework', ['next', 'nextjs', 'nuxt', 'nuxtjs', 'gatsby', 'remix', 'astro', 'sveltekit']],
    ['backend-framework', ['express', 'fastify', 'koa', 'hapi', 'nestjs', 'koa2']],
    ['build-tool', ['webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'bundler', 'build-tool', 'turbopack', 'swc']],
    ['compiler', ['babel', 'typescript', 'compiler', 'transpiler', 'tsc']],
    ['testing', ['test', 'testing', 'jest', 'mocha', 'vitest', 'jasmine', 'assert', 'mock']],
    ['e2e-testing', ['cypress', 'playwright', 'puppeteer', 'e2e', 'end-to-end']],
    ['css-framework', ['css', 'tailwind', 'tailwindcss', 'bootstrap', 'sass', 'scss', 'less', 'postcss', 'styling']],
    ['ui-library', ['component', 'components', 'ui', 'design-system', 'material', 'material-ui', 'antd', 'ant-design', 'chakra', 'headless']],
    ['state-management', ['redux', 'mobx', 'zustand', 'state', 'store', 'pinia', 'vuex', 'recoil', 'jotai']],
    ['database', ['database', 'db', 'sql', 'nosql', 'mongo', 'mongodb', 'postgres', 'postgresql', 'redis']],
    ['orm', ['orm', 'prisma', 'typeorm', 'sequelize', 'mongoose', 'drizzle', 'knex', 'query-builder']],
    ['http-client', ['http', 'fetch', 'axios', 'request', 'ajax', 'got', 'superagent']],
    ['graphql', ['graphql', 'apollo', 'relay', 'gql']],
    ['cli-tool', ['cli', 'command', 'commander', 'yargs', 'inquirer', 'terminal', 'bin']],
    ['node-utility', ['node', 'nodejs', 'fs', 'path', 'util', 'fs-extra']],
    ['linting', ['eslint', 'tslint', 'lint', 'linter', 'biome']],
    ['formatting', ['prettier', 'format', 'formatter', 'formatting']],
    ['utility', ['lodash', 'underscore', 'ramda', 'utility', 'helper', 'utils']],
    ['date-time', ['date', 'time', 'moment', 'dayjs', 'date-fns']],
    ['validation', ['validation', 'validator', 'zod', 'yup', 'joi', 'schema']],
  ];

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  for (const [category, sigs] of signals) {
    for (const sig of sigs) {
      const re = new RegExp(`(^|\\b|[_-])${escape(sig)}($|\\b|[_-])`);
      if (kw.some(k => re.test(k))) return category;
    }
  }

  return null;
}

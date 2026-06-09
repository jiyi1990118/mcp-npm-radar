import axios from 'axios';
import { getSelectedRegistry } from './registry-selector.js';
import { savePackage, saveSnapshot, cleanupOldData } from '../db/queries.js';
import { setCacheTimestamp } from './cache-manager.js';
import { searchPackages } from '../api/npm.js';

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

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

export async function refreshTopPackages() {
  console.error('Refreshing top packages data...');
  const registry = await getSelectedRegistry();

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
            getQualityScores(pkgName),
          ]);

          savePackage({
            name: data.name,
            version: latest,
            description: data.description,
            author: data.author?.name || data.maintainers?.[0]?.name,
            downloads: downloads.monthly,
            weekly_downloads: downloads.weekly,
            quality: scores.quality,
            popularity: scores.popularity,
            maintenance: scores.maintenance,
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

async function getQualityScores(packageName: string): Promise<{ quality: number; popularity: number; maintenance: number }> {
  try {
    const results = await searchPackages(packageName, 5);
    const exactMatch = results.objects?.find((obj: any) => obj.package.name === packageName);
    if (exactMatch?.score?.detail) {
      return {
        quality: exactMatch.score.detail.quality,
        popularity: exactMatch.score.detail.popularity,
        maintenance: exactMatch.score.detail.maintenance,
      };
    }
  } catch {
    // Fallback to default values if search fails
  }
  return { quality: 0.5, popularity: 0.5, maintenance: 0.5 };
}

function inferCategory(keywords?: string[]): string | null {
  if (!keywords) return null;

  const kw = keywords.map(k => k.toLowerCase());

  // Framework categories
  if (kw.some(k => ['react', 'vue', 'angular', 'svelte', 'solid', 'preact', 'lit'].includes(k)))
    return 'web-framework';
  if (kw.some(k => ['next', 'nuxt', 'gatsby', 'remix', 'astro', 'sveltekit'].includes(k)))
    return 'meta-framework';
  if (kw.some(k => ['express', 'fastify', 'koa', 'hapi', 'nestjs'].includes(k)))
    return 'backend-framework';

  // Build & Tools
  if (kw.some(k => ['webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'bundler', 'build'].includes(k)))
    return 'build-tool';
  if (kw.some(k => ['babel', 'typescript', 'compiler', 'transpiler'].includes(k)))
    return 'compiler';

  // Testing
  if (kw.some(k => ['test', 'testing', 'jest', 'mocha', 'vitest', 'jasmine'].includes(k)))
    return 'testing';
  if (kw.some(k => ['cypress', 'playwright', 'puppeteer', 'e2e'].includes(k)))
    return 'e2e-testing';

  // UI & Styling
  if (kw.some(k => ['css', 'tailwind', 'bootstrap', 'sass', 'less', 'postcss', 'styling'].includes(k)))
    return 'css-framework';
  if (kw.some(k => ['component', 'ui', 'design-system', 'material', 'antd', 'chakra'].includes(k)))
    return 'ui-library';
  if (kw.some(k => ['styled-components', 'emotion', 'css-in-js'].includes(k)))
    return 'css-in-js';

  // State & Data
  if (kw.some(k => ['redux', 'mobx', 'zustand', 'state', 'store', 'pinia', 'vuex'].includes(k)))
    return 'state-management';
  if (kw.some(k => ['database', 'db', 'sql', 'nosql', 'mongo', 'postgres'].includes(k)))
    return 'database';
  if (kw.some(k => ['orm', 'prisma', 'typeorm', 'sequelize', 'mongoose'].includes(k)))
    return 'orm';

  // HTTP & API
  if (kw.some(k => ['http', 'fetch', 'axios', 'request', 'ajax'].includes(k)))
    return 'http-client';
  if (kw.some(k => ['graphql', 'apollo', 'relay'].includes(k)))
    return 'graphql';

  // CLI & Node
  if (kw.some(k => ['cli', 'command', 'terminal', 'commander', 'yargs'].includes(k)))
    return 'cli-tool';
  if (kw.some(k => ['node', 'nodejs', 'fs', 'path', 'util'].includes(k)))
    return 'node-utility';

  // Code Quality
  if (kw.some(k => ['eslint', 'tslint', 'lint', 'linter'].includes(k)))
    return 'linting';
  if (kw.some(k => ['prettier', 'format', 'formatter'].includes(k)))
    return 'formatting';

  // Utilities
  if (kw.some(k => ['lodash', 'underscore', 'ramda', 'utility', 'helper'].includes(k)))
    return 'utility';
  if (kw.some(k => ['date', 'time', 'moment', 'dayjs', 'date-fns'].includes(k)))
    return 'date-time';
  if (kw.some(k => ['validation', 'validator', 'zod', 'yup', 'joi'].includes(k)))
    return 'validation';
  if (kw.some(k => ['types', 'typescript', '@types'].includes(k)))
    return 'types';

  return null;
}

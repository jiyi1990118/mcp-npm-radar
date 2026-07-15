#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { selectFastestRegistry } from './utils/registry-selector.js';
import { searchPackages, getPackageInfo } from './api/npm.js';
import { getTrendingPackages, getTopPackages, getPackagesByCategory, getPackagesByDateRange, getWeeklyHot, getIndexedCount } from './db/queries.js';
import { comparePackages, getBundleSize } from './api/compare.js';
import { getPackageVulnerabilities, findAlternatives } from './api/security.js';
import { getRelatedPackages } from './api/related.js';
import { getDownloadHistory } from './api/stats.js';
import { checkTypescriptSupport } from './api/typescript.js';
import { getPackageQualityScore } from './api/quality.js';
import { getPackageReadme } from './api/readme.js';
import { localizeImagesInMarkdown } from './utils/image-downloader.js';
import { refreshTopPackages } from './utils/data-refresher.js';

const server = new Server(
  {
    name: 'mcp-npm-radar',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_packages',
        description: 'Search npm packages by keyword. Returns name, version, description, author, and quality/popularity/maintenance scores. Use this for broad package discovery; use get_packages_by_category only for browsing indexed categories. Pinned to the official npm registry for reliable scores.',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Search keyword (e.g., "react", "http client", "state management")',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 20)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 1-hour API cache and fetch fresh data (default: false)',
            },
          },
          required: ['keyword'],
        },
      },
      {
        name: 'get_package_detail',
        description: 'Get full metadata for an npm package: version, description, author, license, repository, homepage, keywords, dependencies, created/modified dates, and the README. README images are downloaded to ~/.npm-radar/images/ and replaced with local file:// paths (an `images` manifest with {originalUrl, localPath, status} is returned alongside). Use this for deep inspection of a single package.',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name, scoped packages supported (e.g., "react", "@mui/material", "@types/node")',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 1-hour API cache and fetch fresh data (default: false)',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_trending_packages',
        description: 'Get packages with the fastest download growth (current vs previous snapshot). Use when the user wants "rising"/"trending" packages, NOT all-time popular ones. Scope: ~117 indexed packages (check indexed_count). Cold-start falls back to weekly-downloads ordering.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum results (default: 20)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 30-min DB cache and trigger a fresh top-packages refresh (default: false)',
            },
          },
        },
      },
      {
        name: 'get_top_packages',
        description: 'Get packages ranked by all-time total downloads. Use when the user wants the "most downloaded"/"most popular" packages overall. Scope: ~117 indexed packages (check indexed_count).',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum results (default: 50)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 30-min DB cache and trigger a fresh top-packages refresh (default: false)',
            },
          },
        },
      },
      {
        name: 'get_weekly_hot',
        description: 'Get packages ranked by weekly downloads (last 7 days). Use when the user wants "what is popular right now" / short-term hotness, distinct from all-time top. Scope: ~117 indexed packages (check indexed_count).',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum results (default: 50)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 30-min DB cache and trigger a fresh top-packages refresh (default: false)',
            },
          },
        },
      },
      {
        name: 'get_packages_by_category',
        description: 'Get packages filtered by category, ranked by downloads. Scope: ~117 indexed packages (check indexed_count) - use search_packages for broad discovery. Returns indexed_count:0 if the DB is empty (run npm run insert-test or wait for background refresh).',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['web-framework', 'meta-framework', 'backend-framework', 'build-tool', 'compiler', 'testing', 'e2e-testing', 'css-framework', 'ui-library', 'css-in-js', 'state-management', 'database', 'orm', 'http-client', 'graphql', 'cli-tool', 'node-utility', 'linting', 'formatting', 'utility', 'date-time', 'validation', 'types'],
              description: 'Category (must be one of the enum values)',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 50)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 30-min DB cache and trigger a fresh top-packages refresh (default: false)',
            },
          },
          required: ['category'],
        },
      },
      {
        name: 'get_packages_by_date_range',
        description: 'Get packages published within a date range, ranked by downloads. Scope: ~117 indexed packages only (check indexed_count) - this is NOT a registry-wide search. Returns indexed_count:0 if the DB is empty.',
        inputSchema: {
          type: 'object',
          properties: {
            start_date: {
              type: 'string',
              description: 'Start date, ISO format YYYY-MM-DD (e.g., "2023-01-01")',
            },
            end_date: {
              type: 'string',
              description: 'End date, ISO format YYYY-MM-DD (e.g., "2024-01-01")',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 50)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 30-min DB cache and trigger a fresh top-packages refresh (default: false)',
            },
          },
          required: ['start_date', 'end_date'],
        },
      },
      {
        name: 'compare_packages',
        description: 'Compare 2-5 npm packages side-by-side: version, description, license, weekly downloads, dependency count, last publish, repository, maintainer count. Use when the user wants to choose between specific named packages.',
        inputSchema: {
          type: 'object',
          properties: {
            packages: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              maxItems: 5,
              description: 'Array of 2-5 package names, scoped supported (e.g., ["react", "vue", "svelte"])',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 1-hour API cache and fetch fresh data (default: false)',
            },
          },
          required: ['packages'],
        },
      },
      {
        name: 'get_bundle_size',
        description: 'Get the browser bundle size (minified + gzipped) of a package, sourced from bundlephobia. Only meaningful for browser-bundlable packages; CLI/server-only packages may return inaccurate or missing sizes. No caching (always fresh).',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name, scoped supported (e.g., "lodash", "@mui/material")',
            },
            version: {
              type: 'string',
              description: 'Package version (optional, defaults to latest)',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_package_vulnerabilities',
        description: 'Check for known security vulnerabilities via the npm advisory API. Returns a `checked` boolean: if checked is false the API call failed (network/timeout) - this must NOT be interpreted as "no vulnerabilities". When checked is true, vulnerabilityCount of 0 means genuinely clean.',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name, scoped supported (e.g., "express", "@babel/core")',
            },
            version: {
              type: 'string',
              description: 'Package version (optional, defaults to latest)',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'find_alternatives',
        description: 'Find alternative packages that serve the same purpose as the given one (potential replacements). Searches by the package\'s own keywords. Use this when the user wants to replace/swap a package; use get_related_packages for ecosystem neighbors instead.',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name, scoped supported (e.g., "axios", "@reduxjs/toolkit")',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 1-hour API cache and fetch fresh data (default: false)',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_related_packages',
        description: 'Get packages related to a given one by shared keywords and dependencies (ecosystem neighbors, NOT replacements). Use this when the user wants to discover packages used alongside this one; use find_alternatives for same-purpose replacements.',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name, scoped supported (e.g., "react", "@types/node")',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 10)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 1-hour API cache and fetch fresh data (default: false)',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_download_history',
        description: 'Get download-count history from the official npm downloads API. Returns total + average daily downloads and per-day series. NOTE: the downloads API is rate-limit-prone (HTTP 429) - failures are surfaced as errors. last-year returns 365 data points.',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name, scoped supported (e.g., "express", "@types/node")',
            },
            period: {
              type: 'string',
              enum: ['last-day', 'last-week', 'last-month', 'last-year'],
              description: 'Time range (default: last-month)',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'check_typescript_support',
        description: 'Check if a package has TypeScript type definitions, distinguishing built-in types (in package.json) from DefinitelyTyped (@types/<name>). Returns builtInTypes, definitelyTyped, typesVersion, and a recommendation string.',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name, scoped supported (e.g., "express", "lodash")',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 1-hour API cache and fetch fresh data (default: false)',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_package_quality_score',
        description: 'Get a 0-100 quality score across popularity, maintenance, and quality dimensions, plus an overall rating. Prefers real npm registry scores (scoreSource="npm"); falls back to a heuristic (scoreSource="heuristic") when unavailable. monthlyDownloads may be null if the rate-limited downloads API failed.',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name, scoped supported (e.g., "axios", "@prisma/client")',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 1-hour API cache and fetch fresh data (default: false)',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_package_readme',
        description: 'Get the full README for a package. README images are downloaded to ~/.npm-radar/images/ in parallel and replaced with local file:// paths (an `images` manifest with {originalUrl, localPath, status} is returned). Use get_package_detail if you also need metadata (version, deps, dates).',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name, scoped supported (e.g., "react", "@babel/core")',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Bypass the 1-hour API cache and fetch fresh data (default: false)',
            },
          },
          required: ['package_name'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_packages': {
        const { keyword, limit = 20, forceRefresh = false } = args as { keyword: string; limit?: number; forceRefresh?: boolean };
        const results = await searchPackages(keyword, limit, forceRefresh);

        const packages = results.objects?.map((obj: any) => ({
          name: obj.package.name,
          version: obj.package.version,
          description: obj.package.description,
          author: obj.package.author?.name || obj.package.publisher?.username,
          downloads: obj.package.downloads,
          quality: obj.score?.detail?.quality,
          popularity: obj.score?.detail?.popularity,
          maintenance: obj.score?.detail?.maintenance,
        })) || [];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, count: packages.length, packages }, null, 2),
            },
          ],
        };
      }

      case 'get_package_detail': {
        const { package_name, forceRefresh = false } = args as { package_name: string; forceRefresh?: boolean };
        const info = await getPackageInfo(package_name, forceRefresh);

        const latest = info['dist-tags']?.latest;
        const latestVersion = info.versions?.[latest];

        const { content: localizedReadme, images } = await localizeImagesInMarkdown(info.readme || '', package_name);

        const packageDetail = {
          name: info.name,
          version: latest,
          description: info.description,
          author: info.author?.name || info.maintainers?.[0]?.name,
          license: latestVersion?.license || info.license,
          repository: info.repository?.url,
          homepage: info.homepage,
          keywords: info.keywords,
          dependencies: latestVersion?.dependencies,
          devDependencies: latestVersion?.devDependencies,
          created: info.time?.created,
          modified: info.time?.modified,
          readme: localizedReadme,
          images,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, package: packageDetail }, null, 2),
            },
          ],
        };
      }

      case 'get_trending_packages': {
        const { limit = 20, forceRefresh = false } = args as { limit?: number; forceRefresh?: boolean };
        const trending = await getTrendingPackages(limit, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, count: trending.length, indexed_count: getIndexedCount(), packages: trending }, null, 2),
            },
          ],
        };
      }

      case 'get_top_packages': {
        const { limit = 50, forceRefresh = false } = args as { limit?: number; forceRefresh?: boolean };
        const top = await getTopPackages(limit, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, count: top.length, indexed_count: getIndexedCount(), packages: top }, null, 2),
            },
          ],
        };
      }

      case 'get_weekly_hot': {
        const { limit = 50, forceRefresh = false } = args as { limit?: number; forceRefresh?: boolean };
        const hot = await getWeeklyHot(limit, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, count: hot.length, indexed_count: getIndexedCount(), packages: hot }, null, 2),
            },
          ],
        };
      }

      case 'get_packages_by_category': {
        const { category, limit = 50, forceRefresh = false } = args as { category: string; limit?: number; forceRefresh?: boolean };
        const packages = await getPackagesByCategory(category, limit, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, category, count: packages.length, indexed_count: getIndexedCount(), packages }, null, 2),
            },
          ],
        };
      }

      case 'get_packages_by_date_range': {
        const { start_date, end_date, limit = 50, forceRefresh = false } = args as { start_date: string; end_date: string; limit?: number; forceRefresh?: boolean };
        const startTime = new Date(start_date).getTime();
        const endTime = new Date(end_date).getTime();
        const packages = await getPackagesByDateRange(startTime, endTime, limit, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, date_range: { start: start_date, end: end_date }, count: packages.length, indexed_count: getIndexedCount(), packages }, null, 2),
            },
          ],
        };
      }

      case 'compare_packages': {
        const { packages, forceRefresh = false } = args as { packages: string[]; forceRefresh?: boolean };
        const comparison = await comparePackages(packages, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, comparison }, null, 2),
            },
          ],
        };
      }

      case 'get_bundle_size': {
        const { package_name, version } = args as { package_name: string; version?: string };
        const bundleSize = await getBundleSize(package_name, version);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, bundleSize }, null, 2),
            },
          ],
        };
      }

      case 'get_package_vulnerabilities': {
        const { package_name, version } = args as { package_name: string; version?: string };
        const vulnerabilities = await getPackageVulnerabilities(package_name, version);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, vulnerabilities }, null, 2),
            },
          ],
        };
      }

      case 'find_alternatives': {
        const { package_name, forceRefresh = false } = args as { package_name: string; forceRefresh?: boolean };
        const alternatives = await findAlternatives(package_name, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, alternatives }, null, 2),
            },
          ],
        };
      }

      case 'get_related_packages': {
        const { package_name, limit = 10, forceRefresh = false } = args as { package_name: string; limit?: number; forceRefresh?: boolean };
        const related = await getRelatedPackages(package_name, limit, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, related }, null, 2),
            },
          ],
        };
      }

      case 'get_download_history': {
        const { package_name, period = 'last-month' } = args as { package_name: string; period?: 'last-day' | 'last-week' | 'last-month' | 'last-year' };
        const history = await getDownloadHistory(package_name, period);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, history }, null, 2),
            },
          ],
        };
      }

      case 'check_typescript_support': {
        const { package_name, forceRefresh = false } = args as { package_name: string; forceRefresh?: boolean };
        const support = await checkTypescriptSupport(package_name, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, support }, null, 2),
            },
          ],
        };
      }

      case 'get_package_quality_score': {
        const { package_name, forceRefresh = false } = args as { package_name: string; forceRefresh?: boolean };
        const quality = await getPackageQualityScore(package_name, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, quality }, null, 2),
            },
          ],
        };
      }

      case 'get_package_readme': {
        const { package_name, forceRefresh = false } = args as { package_name: string; forceRefresh?: boolean };
        const readme = await getPackageReadme(package_name, forceRefresh);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, readme }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: (error as Error).message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  // Select fastest registry on startup
  await selectFastestRegistry();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('npm-radar MCP server running on stdio');

  // Background auto-refresh every hour
  const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour
  setInterval(() => {
    refreshTopPackages().catch((err) => {
      console.error('Background refresh failed:', err);
    });
  }, REFRESH_INTERVAL);

  // Initial refresh to prewarm cache (non-blocking)
  refreshTopPackages().catch((err) => {
    console.error('Initial refresh failed:', err);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

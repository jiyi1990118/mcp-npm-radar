#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { selectFastestRegistry } from './utils/registry-selector.js';
import { searchPackages, getPackageInfo } from './api/npm.js';
import { getTrendingPackages, getTopPackages, getPackagesByCategory, getPackagesByDateRange, getWeeklyHot } from './db/queries.js';
import { comparePackages, getBundleSize } from './api/compare.js';
import { getPackageVulnerabilities, findAlternatives } from './api/security.js';
import { getRelatedPackages } from './api/related.js';
import { getDownloadHistory } from './api/stats.js';
import { checkTypescriptSupport } from './api/typescript.js';
import { getPackageQualityScore } from './api/quality.js';
import { getPackageReadme } from './api/readme.js';
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
        description: 'Search npm packages by keyword with filters',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Search keyword',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 20)',
            },
          },
          required: ['keyword'],
        },
      },
      {
        name: 'get_package_detail',
        description: 'Get detailed information about an npm package',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name (e.g., "react", "express")',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_trending_packages',
        description: 'Get trending npm packages based on download growth (requires database)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum results (default: 20)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Force refresh data from npm API, bypassing cache (default: false)',
            },
          },
        },
      },
      {
        name: 'get_top_packages',
        description: 'Get top npm packages by total downloads (requires database)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum results (default: 50)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Force refresh data from npm API, bypassing cache (default: false)',
            },
          },
        },
      },
      {
        name: 'get_weekly_hot',
        description: 'Get hot packages by weekly downloads (requires database)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum results (default: 50)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Force refresh data from npm API, bypassing cache (default: false)',
            },
          },
        },
      },
      {
        name: 'get_packages_by_category',
        description: 'Get packages filtered by category (requires database)',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Package category (e.g., "web-framework", "cli-tool", "database")',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 50)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Force refresh data from npm API, bypassing cache (default: false)',
            },
          },
          required: ['category'],
        },
      },
      {
        name: 'get_packages_by_date_range',
        description: 'Get packages published within a date range (requires database)',
        inputSchema: {
          type: 'object',
          properties: {
            start_date: {
              type: 'string',
              description: 'Start date (ISO format: YYYY-MM-DD)',
            },
            end_date: {
              type: 'string',
              description: 'End date (ISO format: YYYY-MM-DD)',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 50)',
            },
            forceRefresh: {
              type: 'boolean',
              description: 'Force refresh data from npm API, bypassing cache (default: false)',
            },
          },
          required: ['start_date', 'end_date'],
        },
      },
      {
        name: 'compare_packages',
        description: 'Compare multiple npm packages side-by-side',
        inputSchema: {
          type: 'object',
          properties: {
            packages: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of package names to compare (2-5 packages)',
            },
          },
          required: ['packages'],
        },
      },
      {
        name: 'get_bundle_size',
        description: 'Get the bundle size of a package (minified and gzipped)',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name',
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
        description: 'Check for known security vulnerabilities in a package',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name',
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
        description: 'Find alternative packages with similar functionality',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name to find alternatives for',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_related_packages',
        description: 'Get packages related to a specific package',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 10)',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_download_history',
        description: 'Get download history and trends for a package',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name',
            },
            period: {
              type: 'string',
              enum: ['last-day', 'last-week', 'last-month', 'last-year'],
              description: 'Time period (default: last-month)',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'check_typescript_support',
        description: 'Check if a package has TypeScript type definitions',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_package_quality_score',
        description: 'Get comprehensive quality score for a package',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name',
            },
          },
          required: ['package_name'],
        },
      },
      {
        name: 'get_package_readme',
        description: 'Get package README with usage instructions and documentation',
        inputSchema: {
          type: 'object',
          properties: {
            package_name: {
              type: 'string',
              description: 'Package name',
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
        const { keyword, limit = 20 } = args as { keyword: string; limit?: number };
        const results = await searchPackages(keyword, limit);

        const packages = results.objects?.map((obj: any) => ({
          name: obj.package.name,
          version: obj.package.version,
          description: obj.package.description,
          author: obj.package.author?.name || obj.package.publisher?.username,
          downloads: obj.package.downloads,
          quality: obj.score.detail.quality,
          popularity: obj.score.detail.popularity,
          maintenance: obj.score.detail.maintenance,
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
        const { package_name } = args as { package_name: string };
        const info = await getPackageInfo(package_name);

        const latest = info['dist-tags']?.latest;
        const latestVersion = info.versions?.[latest];

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
              text: JSON.stringify({ success: true, count: trending.length, packages: trending }, null, 2),
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
              text: JSON.stringify({ success: true, count: top.length, packages: top }, null, 2),
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
              text: JSON.stringify({ success: true, count: hot.length, packages: hot }, null, 2),
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
              text: JSON.stringify({ success: true, category, count: packages.length, packages }, null, 2),
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
              text: JSON.stringify({ success: true, date_range: { start: start_date, end: end_date }, count: packages.length, packages }, null, 2),
            },
          ],
        };
      }

      case 'compare_packages': {
        const { packages } = args as { packages: string[] };
        const comparison = await comparePackages(packages);

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
        const { package_name } = args as { package_name: string };
        const alternatives = await findAlternatives(package_name);

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
        const { package_name, limit = 10 } = args as { package_name: string; limit?: number };
        const related = await getRelatedPackages(package_name, limit);

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
        const { package_name } = args as { package_name: string };
        const support = await checkTypescriptSupport(package_name);

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
        const { package_name } = args as { package_name: string };
        const quality = await getPackageQualityScore(package_name);

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
        const { package_name } = args as { package_name: string };
        const readme = await getPackageReadme(package_name);

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

#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { selectFastestRegistry } from './utils/registry-selector.js';
import { searchPackages, getPackageInfo } from './api/npm.js';
import { getTrendingPackages } from './db/queries.js';

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
          },
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
        const { limit = 20 } = args as { limit?: number };
        const trending = getTrendingPackages(limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, count: trending.length, packages: trending }, null, 2),
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
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

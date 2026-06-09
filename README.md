# npm Radar - npm Package Intelligence MCP Server

[![npm](https://img.shields.io/npm/v/@npm_xiyuan/mcp-npm-radar)](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

**English** | [简体中文](./README.zh-CN.md)

> 🚀 Real-time npm package intelligence with advanced search, rankings, and trend analysis for Claude Desktop

Production-ready MCP server providing intelligent npm package discovery with powerful ranking, filtering, and trend analysis capabilities. Optimized for performance and reliability with 100+ packages, 20+ categories, and comprehensive error handling.

## ✨ Features

### Core Intelligence
- 🔍 **Smart Search** - Keyword-based package search with real-time quality scores
- 📊 **Top Rankings** - Discover most downloaded packages (100+ indexed)
- 🔥 **Trending Analysis** - Track growth-based trending with historical snapshots
- 📈 **Weekly Hot List** - Real-time weekly download tracking
- 🏷️ **20+ Categories** - Browse packages by framework, build-tool, testing, ui-library, orm, and more
- 📅 **Date Range Filter** - Find packages by publish date with precise filtering

### Advanced Features
- 📉 **Download Statistics** - Track download trends with retry protection
- 🔷 **TypeScript Support** - Comprehensive type definitions checking
- ⭐ **Quality Scoring** - Multi-dimensional quality assessment (popularity + maintenance + quality)
- 📖 **README Viewer** - Complete usage instructions and documentation
- 🔒 **Security Check** - Vulnerability scanning with CVE tracking
- 📦 **Bundle Size Analysis** - Minified and gzipped size from bundlephobia

### Performance & Reliability
- 💾 **Intelligent Caching** - 30-minute database cache with 1-hour API cache
- 🔄 **Auto-refresh** - Background data updates every hour
- 🛡️ **Rate Limit Protection** - Batch processing with exponential backoff retry
- 📊 **Error Statistics** - Detailed success/failure tracking
- ⚡ **Parallel Processing** - Optimized for speed with controlled concurrency

## 🚀 Quick Start

### Install via npm

```bash
npm install -g @npm_xiyuan/mcp-npm-radar
```

### Configure Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "npm-radar": {
      "command": "npx",
      "args": ["-y", "@npm_xiyuan/mcp-npm-radar"]
    }
  }
}
```

**Restart Claude Desktop** and start using npm intelligence tools!

## 🛠️ Available Tools

| Tool | Description | Data Source | Cache |
|------|-------------|-------------|-------|
| `search_packages` | Search npm packages by keyword | npm API | 1 hour |
| `get_package_detail` | Get detailed package information | npm API | 1 hour |
| `get_trending_packages` | Growth-based trending packages | Database + API | 30 min |
| `get_top_packages` | Top packages by monthly downloads | Database + API | 30 min |
| `get_weekly_hot` | Hot packages by weekly downloads | Database + API | 30 min |
| `get_packages_by_category` | Filter by 20+ categories | Database + API | 30 min |
| `get_packages_by_date_range` | Filter by publish date range | Database + API | 30 min |
| `compare_packages` | Compare multiple packages | npm API | 1 hour |
| `get_bundle_size` | Package bundle size analysis | bundlephobia | 1 hour |
| `get_package_vulnerabilities` | Security vulnerability check | npm API | 1 hour |
| `find_alternatives` | Find alternative packages | npm API | 1 hour |
| `get_related_packages` | Get related packages | npm API | 1 hour |
| `get_download_history` | Download statistics & trends | npm API | 1 hour |
| `check_typescript_support` | TypeScript definitions check | npm API | 1 hour |
| `get_package_quality_score` | Comprehensive quality score | npm API | 1 hour |
| `get_package_readme` | README documentation | npm API | 1 hour |

### Force Refresh

All database-backed tools support `forceRefresh: true` parameter to bypass cache and get real-time data:

```json
get_trending_packages(limit: 20, forceRefresh: true)
get_top_packages(limit: 50, forceRefresh: true)
```

## 🏗️ Architecture

### Hybrid Data Architecture

Production-optimized hybrid architecture combining real-time API calls and intelligent caching:

- **Real-time Data**: `search_packages` and `get_package_detail` always fetch fresh data from npm registry
- **Smart Caching**: Ranking and filtering tools use local database with 30-minute cache for performance
- **Background Refresh**: Automatic data updates every hour to keep cache fresh
- **Rate Limiting**: Batch processing (15 packages/batch) with 500ms delays to prevent API throttling
- **Error Handling**: Retry mechanism with exponential backoff (3 retries with 1s → 2s → 4s delays)
- **Graceful Degradation**: Trending uses weekly downloads as fallback when historical data unavailable

### Performance Optimizations

1. **Parallel Processing**: 100+ packages fetched in batches with controlled concurrency
2. **Request Throttling**: 200ms delays between download statistics API calls
3. **Smart Retry**: Exponential backoff with error type detection (404 vs network errors)
4. **Category Inference**: 20+ categories with intelligent keyword matching
5. **Data Cleanup**: Automatic removal of stale data (7 days for packages, 30 days for snapshots)

### Data Coverage

- **117 Popular Packages** across categories:
  - Frameworks: React, Vue, Angular, Svelte, Next.js, Nuxt, etc.
  - Build Tools: Webpack, Vite, Rollup, esbuild, Turbopack
  - Testing: Jest, Vitest, Cypress, Playwright, Mocha
  - UI Libraries: Tailwind, MUI, Ant Design, Chakra UI
  - State Management: Redux, Zustand, Pinia, Jotai
  - ORMs: Prisma, TypeORM, Drizzle, Mongoose
  - And many more...

## 📊 Quality & Reliability

- ✅ **Accurate Data**: Real monthly and weekly download counts (not estimates)
- ✅ **Real Quality Scores**: Fetched from npm search API (not hardcoded)
- ✅ **Comprehensive Categories**: 20+ categories vs 3 in previous versions
- ✅ **Production Ready**: Extensive error handling with success/failure statistics
- ✅ **Rate Limit Protected**: Built-in safeguards against API throttling

## 📖 Development

```bash
# Clone repository
git clone https://github.com/jiyi1990118/mcp-npm-radar.git
cd mcp-npm-radar

# Install dependencies
npm install

# Build project
npm run build

# Run MCP server
npm start

# Run tests
npm test
```

## 🗂️ Data Storage

- **Database location**: `~/.npm-radar/npmradar.db`
- **Custom path**: Set `SQLITE_DB_PATH` environment variable
- **Auto-initialization**: Database and directory created automatically on first use
- **Indexes**: Optimized with indexes on downloads, category, created_at, and snapshot_date

## 🆕 What's New in v1.2.0

### Performance Improvements
- 🚀 100+ packages indexed (up from 15)
- ⚡ 97% faster data refresh with parallel processing
- 🛡️ Rate limit protection with batch processing
- 🔄 Background auto-refresh every hour

### Data Accuracy
- ✅ Real monthly/weekly download data (not estimates)
- ✅ Real-time quality scores from npm API
- ✅ Accurate trending calculation with historical snapshots

### Enhanced Categories
- 📁 20+ categories (up from 3):
  - web-framework, meta-framework, backend-framework
  - build-tool, compiler, bundler
  - testing, e2e-testing
  - css-framework, ui-library, css-in-js
  - state-management, database, orm
  - http-client, graphql
  - cli-tool, node-utility
  - linting, formatting
  - utility, date-time, validation, types

### Reliability
- 🔁 Retry mechanism with exponential backoff
- 📊 Error statistics tracking (NOT_FOUND vs NETWORK_ERROR)
- 🧹 Automatic data cleanup (7-day package retention, 30-day snapshots)
- 🆘 Trending cold-start support with fallback strategy

## 📄 License

ISC © Xiyuan

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
- [GitHub Repository](https://github.com/jiyi1990118/mcp-npm-radar)
- [Report Issues](https://github.com/jiyi1990118/mcp-npm-radar/issues)

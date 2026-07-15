# npm Radar - npm Package Intelligence MCP Server

[![npm](https://img.shields.io/npm/v/@npm_xiyuan/mcp-npm-radar)](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

**English** | [简体中文](./README.zh-CN.md)

> 🚀 Real-time npm package intelligence with advanced search, rankings, and trend analysis for Claude Desktop

Production-ready MCP server providing intelligent npm package discovery with powerful ranking, filtering, and trend analysis capabilities. Optimized for performance and reliability with 117 indexed packages, 23 categories, image localization, and comprehensive error handling.

## ✨ Features

### Core Intelligence
- 🔍 **Smart Search** - Keyword-based package search with real-time quality scores (pinned to official npm registry)
- 📊 **Top Rankings** - Discover most downloaded packages (117 indexed; `indexed_count` in every DB response)
- 🔥 **Trending Analysis** - Track growth-based trending with historical snapshots
- 📈 **Weekly Hot List** - Real-time weekly download tracking
- 🏷️ **23 Categories** - Browse packages by framework, build-tool, testing, ui-library, orm, and more (enum-validated)
- 📅 **Date Range Filter** - Find packages by publish date with precise filtering

### Advanced Features
- 🖼️ **Image Localization** - README images auto-downloaded to local paths for downstream analysis
- 📉 **Download Statistics** - Track download trends with retry protection
- 🔷 **TypeScript Support** - Comprehensive type definitions checking (built-in vs DefinitelyTyped)
- ⭐ **Quality Scoring** - Multi-dimensional quality assessment, prefers real npm scores with heuristic fallback
- 📖 **README Viewer** - Complete documentation with localized images
- 🔒 **Security Check** - Vulnerability scanning with `checked` status (distinguishes "no vulns" from "check failed")
- 📦 **Bundle Size Analysis** - Minified and gzipped size from bundlephobia

### Performance & Reliability
- 💾 **Intelligent Caching** - 30-minute database cache with 1-hour API cache (all tools support `forceRefresh`)
- 🔄 **Auto-refresh** - Background data updates every hour (returns `RefreshResult`, never throws)
- 🛡️ **Rate Limit Protection** - Batch processing with exponential backoff retry (skips 4xx)
- 📊 **Error Statistics** - Detailed success/failure tracking
- ⚡ **Parallel Processing** - Optimized for speed with controlled concurrency
- 🔀 **Three Data Channels** - Each data type routed to its most reliable source

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
| `search_packages` | Search npm packages by keyword (returns quality/popularity/maintenance scores) | Official npm registry | 1 hour |
| `get_package_detail` | Full metadata + README (images downloaded locally, see [Image Localization](#-image-localization)) | Mirror registry | 1 hour |
| `get_trending_packages` | Growth-based trending packages (response includes `indexed_count`) | Database + API | 30 min |
| `get_top_packages` | Top packages by total downloads (response includes `indexed_count`) | Database + API | 30 min |
| `get_weekly_hot` | Hot packages by weekly downloads (response includes `indexed_count`) | Database + API | 30 min |
| `get_packages_by_category` | Filter by 23 categories (enum-validated, response includes `indexed_count`) | Database + API | 30 min |
| `get_packages_by_date_range` | Filter by publish date (response includes `indexed_count`) | Database + API | 30 min |
| `compare_packages` | Compare 2-5 packages side-by-side (minItems/maxItems enforced) | Mirror registry | 1 hour |
| `get_bundle_size` | Browser bundle size from bundlephobia (browser-bundlable packages only) | bundlephobia | None |
| `get_package_vulnerabilities` | Vulnerability check (returns `checked` boolean; `false` = API failed, NOT "no vulns") | npm advisory API | None |
| `find_alternatives` | Find same-purpose replacement packages (via package's own keywords) | Official npm registry | 1 hour |
| `get_related_packages` | Get ecosystem-neighbor packages (by shared keywords/deps) | Official npm registry | 1 hour |
| `get_download_history` | Download history & trends (rate-limit-prone, surfaces HTTP 429) | npm downloads API | 1 hour |
| `check_typescript_support` | Built-in types vs DefinitelyTyped (@types) check | Mirror registry | 1 hour |
| `get_package_quality_score` | 0-100 score (prefers real npm scores, `scoreSource: npm\|heuristic`) | Mirror + npm registry | 1 hour |
| `get_package_readme` | Full README (images downloaded locally, see [Image Localization](#-image-localization)) | Mirror registry | 1 hour |

### Force Refresh

All API-backed and database-backed tools support `forceRefresh: true` to bypass the cache:

```json
search_packages(keyword: "react", forceRefresh: true)
get_package_detail(package_name: "express", forceRefresh: true)
get_trending_packages(limit: 20, forceRefresh: true)
```

`get_bundle_size` and `get_package_vulnerabilities` have no shared cache (always fresh), so `forceRefresh` does not apply.

## 🏗️ Architecture

### Three Data Channels

Each data type is routed to the most reliable source for it:

| Channel | Source | Why |
|---------|--------|-----|
| Package metadata (`GET /<pkg>`) | Fastest selected mirror | Large payloads; mirrors accelerate it |
| Search (`/-/v1/search`) | Official npm registry only | Mirror search is unreliable (huawei returns 0 results, npmmirror omits `score`) |
| Download counts (`api.npmjs.org/downloads`) | Official npm downloads API | Only host that serves download stats |

- **Registry Selection**: On startup the server probes 4 mirrors (npm, npmmirror, tencent, huawei) via `GET /-/ping` (~2-38 bytes), picks the fastest, and rechecks every 6h. Falls back to official npm if all fail. Diagnostics available via `checkAllRegistries()` / `getLastRegistryStatuses()`.
- **Background Refresh**: `refreshTopPackages()` runs hourly, fetching ~117 popular packages in batches of 15 (500ms delay). It returns a `RefreshResult` and never throws - on registry failure it logs `[REFRESH_ABORTED]`, still sets the cache timestamp, and returns the error.
- **Rate Limiting**: Batch processing with exponential backoff retry (3 retries, skips 4xx). The download API is rate-limit-prone (429); `get_package_quality_score` treats download failures as non-fatal.
- **Graceful Degradation**: Trending falls back to weekly-downloads ordering when no historical snapshots exist.

### 🖼️ Image Localization

`get_package_detail` and `get_package_readme` automatically localize images found in README markdown:

1. Extracts `![alt](url)` and `<img src>` URLs
2. Downloads images **in parallel** (concurrency 8, per-image timeout 15s, 2 retries)
3. Waits for **all** images to settle before returning complete content
4. Replaces each image inline with `![alt](file:///abs/path)<!--IMG {"path":...,"orig":...,"status":"ok"}-->`
5. Failed images become `<!--IMG {"path":null,"status":"failed","reason":...}-->` (does NOT block the response)

Files are saved to `~/.npm-radar/images/<package>/<sha1(url)>.<ext>` and reused on subsequent calls. The response also includes an `images` manifest array (`{originalUrl, localPath, status, reason?, alt?}`).

**Downstream tools** can locate image placeholders via the regex `<!--IMG\s+(\{.*?\})-->` and backfill analysis results at the exact position.

| Environment Variable | Default | Effect |
|---|---|---|
| `NPM_RADAR_IMAGE_DIR` | `~/.npm-radar/images` | Image storage directory |
| `NPM_RADAR_IMAGE_CONCURRENCY` | `8` | Parallel download workers |
| `NPM_RADAR_IMAGE_TIMEOUT_MS` | `15000` | Per-image timeout (ms) |

### Performance Optimizations

1. **Lightweight Probe**: Registry selection uses `GET /-/ping` (~2-38 bytes) instead of fetching a full package (844KB)
2. **Parallel Processing**: 100+ packages fetched in batches with controlled concurrency
3. **Smart Retry**: Exponential backoff that skips 4xx errors (no point retrying 404s)
4. **Cache Caps**: In-memory caches are capped at 500 entries (LRU eviction) to bound memory
5. **Category Inference**: 23 categories with word-boundary keyword matching
6. **Data Cleanup**: Automatic removal of stale data (7 days for packages, 30 days for snapshots)

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
- ✅ **Real Quality Scores**: Prefers npm search API scores, falls back to heuristic (`scoreSource` field)
- ✅ **Comprehensive Categories**: 23 categories with word-boundary keyword matching
- ✅ **Honest Vulnerability Status**: `checked` boolean distinguishes "no vulns" from "check failed"
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

## 🆕 Recent Improvements

- 🖼️ **Image Localization**: README images auto-downloaded to local paths in parallel for downstream analysis
- 🔀 **Three Data Channels**: Package metadata via mirror, search via official npm, downloads via npm stats API
- ⚡ **Lightweight Registry Probe**: Switched from `GET /axios` (844KB) to `GET /-/ping` (~2-38 bytes)
- 🔄 **forceRefresh Everywhere**: All API-backed and DB-backed tools now support cache bypass
- 🛡️ **Resilient Refresh**: `refreshTopPackages` returns `RefreshResult`, never throws, sets cache on partial failure
- 🔒 **Honest Vulnerability Status**: `checked` field distinguishes "no vulns" from "check failed"
- ⭐ **Score Source Transparency**: `scoreSource: npm|heuristic` in quality scores
- 📊 **Indexed Count**: All DB-backed tools return `indexed_count` to signal data readiness
- 🏷️ **Category Enum**: 23 categories enum-validated in the tool schema
- 🗑️ **Dead Code Removed**: `compareDownloadTrends`/`calculateTrend` orphans removed; shared `retryWithBackoff` extracted

## 🆕 What's New in v1.2.0

### Performance Improvements
- 🚀 117 packages indexed (up from 15)
- ⚡ 97% faster data refresh with parallel processing
- 🛡️ Rate limit protection with batch processing
- 🔄 Background auto-refresh every hour

### Data Accuracy
- ✅ Real monthly/weekly download data (not estimates)
- ✅ Real-time quality scores from npm API
- ✅ Accurate trending calculation with historical snapshots

### Enhanced Categories
- 📁 23 categories (up from 3):
  - web-framework, meta-framework, backend-framework
  - build-tool, compiler
  - testing, e2e-testing
  - css-framework, ui-library, css-in-js
  - state-management, database, orm
  - http-client, graphql
  - cli-tool, node-utility
  - linting, formatting
  - utility, date-time, validation, types

### Reliability
- 🔁 Retry mechanism with exponential backoff (skips 4xx)
- 📊 Error statistics tracking (NOT_FOUND vs NETWORK_ERROR)
- 🧹 Automatic data cleanup (7-day package retention, 30-day snapshots)
- 🆘 Trending cold-start support with fallback strategy

## 📄 License

ISC © Xiyuan

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
- [GitHub Repository](https://github.com/jiyi1990118/mcp-npm-radar)
- [Report Issues](https://github.com/jiyi1990118/mcp-npm-radar/issues)

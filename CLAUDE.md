# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件为 Claude Code (claude.ai/code) 在此代码库中工作提供指导。

## Project Overview / 项目概述

MCP server providing npm package intelligence with a hybrid architecture combining real-time API calls and local database caching for performance-critical operations.

提供 npm 包智能分析的 MCP 服务器，采用混合架构，结合实时 API 调用和本地数据库缓存以实现性能关键操作。

## Development Commands / 开发命令

```bash
# Build the project (compiles TypeScript + copies SQL schemas)
# 构建项目（编译 TypeScript + 复制 SQL 模式文件）
npm run build

# Development mode with auto-reload
# 开发模式（自动重载）
npm run dev

# Run MCP server (after build)
# 运行 MCP 服务器（构建后）
npm start

# Test database queries and tools
# 测试数据库查询和工具
npm test

# Insert test data into database
# 插入测试数据到数据库
npm run insert-test
```

**Build Requirements**: The build process must copy SQL schema files from `src/db/*.sql` to `dist/db/` using the `copy-sql` script. If modifying build scripts, ensure SQL files are included.

**构建要求**：构建过程必须使用 `copy-sql` 脚本将 SQL 模式文件从 `src/db/*.sql` 复制到 `dist/db/`。如果修改构建脚本，请确保包含 SQL 文件。

## Architecture / 架构

### Hybrid Data Source Pattern / 混合数据源模式

The server uses **three data channels**, each routed to its most reliable source:

服务器使用**三个数据通道**，各自路由到最可靠的源：

1. **Package metadata** (`src/api/npm.ts`, `getPackageInfo`, `GET /<pkg>`)
   - Uses the fastest selected mirror registry
   - 1-hour in-memory cache (supports `forceRefresh`)
   - Used by: `get_package_detail`, `compare_packages`, `check_typescript_support`, `get_package_readme`, `find_alternatives`, `get_related_packages`, `get_package_quality_score`

   **包元数据** - 使用最快的镜像注册表，1 小时内存缓存，支持 `forceRefresh`

2. **Search** (`src/api/npm.ts`, `searchPackages`, `/-/v1/search`)
   - Pinned to the **official npm registry** (NOT the selected mirror)
   - Mirror search implementations are unreliable: huawei returns 0 results, npmmirror omits the `score` field
   - 1-hour in-memory cache (supports `forceRefresh`)
   - Used by: `search_packages`, and indirectly by `find_alternatives`, `get_package_quality_score` (via `getNpmScores`)

   **搜索** - 固定走官方 npm 注册表（不走镜像），因为镜像搜索不可靠（华为云返回 0 结果、npmmirror 缺 `score`）

3. **Download counts** (`src/api/stats.ts`, `data-refresher.ts`)
   - Hardcoded to `https://api.npmjs.org/downloads/...` (only host that serves them)
   - Rate-limit-prone (429); `get_package_quality_score` treats download failure as non-fatal

   **下载量** - 写死 `api.npmjs.org`（唯一提供下载统计的主机），易限流（429）

4. **SQLite Database** (`src/db/`)
   - Used by: `get_trending_packages`, `get_top_packages`, `get_weekly_hot`, `get_packages_by_category`, `get_packages_by_date_range`
   - All 5 return `indexed_count` (total packages in DB); if 0, data hasn't been indexed yet
   - 30-min cache (shared key `'top_packages'`); all 5 share one `refreshTopPackages()` trigger
   - Scope: only the ~117 hardcoded `POPULAR_PACKAGES` (not registry-wide)

   **SQLite 数据库** - 5 个 DB 工具均返回 `indexed_count`；30 分钟缓存（共享 `top_packages` 键）；仅覆盖 ~117 个硬编码包

**Why this split?** Each data type has a different reliability/latency tradeoff. Mirrors are fast for metadata but their search is broken. Download stats only exist on npm's host. Rankings need historical aggregation the API can't provide.

**为什么这么分？** 每种数据类型的可靠性和延迟权衡不同。镜像元数据快但搜索坏；下载统计只有 npm 有；排名需要 API 无法提供的历史聚合。

### Registry Selection / 注册表选择 (`src/utils/registry-selector.ts`)

On server startup, the system probes multiple npm registries via `GET /-/ping` (~2-38 bytes, NOT the old `GET /axios` which downloaded 844KB) and selects the fastest:
- Probes: npm, npmmirror, Tencent cloud, Huawei cloud
- Rechecks every 6 hours automatically via `getSelectedRegistry()`
- Falls back to official npm registry if all probes fail
- Diagnostics: `checkAllRegistries()` / `getLastRegistryStatuses()` return per-mirror `{name, url, latency, ok}`
- **Note**: only package metadata uses the selected mirror; search is pinned to official npm (see above)

服务器启动时，通过 `GET /-/ping`（~2-38 字节，非旧的 `GET /axios` 844KB）探测多个注册表并选最快的。每 6 小时复检，全失败回退官方 npm。仅包元数据用镜像；搜索固定走官方 npm。

**When modifying**: If adding new registry sources, add to `NPM_REGISTRIES` array.

**修改时注意**：添加新注册表源请加入 `NPM_REGISTRIES` 数组。

### Data Population / 数据填充

Database tools return empty results (with `indexed_count: 0`) until packages are inserted. Two ways to populate:
- `npm run insert-test` - seeds 10 deterministic fake packages + snapshots
- Background `refreshTopPackages()` - runs hourly on server start, fetches ~117 real packages in batches of 15 (500ms delay). Returns a `RefreshResult` (`{success, failed, total, error?}`) and **never throws** - on registry failure it logs `[REFRESH_ABORTED]`, still sets the cache timestamp, and returns the error.

数据库工具在插入数据前返回空结果（`indexed_count: 0`）。两种填充方式：`npm run insert-test`（10 个假包）或后台 `refreshTopPackages()`（每小时刷新 ~117 个真实包，返回 `RefreshResult`，永不抛异常）。

## Key File Purposes / 关键文件用途

- `src/server.ts`: MCP server entrypoint, tool definitions + descriptions, request routing / MCP 服务器入口点、工具定义与描述、请求路由
- `src/api/npm.ts`: `searchPackages` (official npm) + `getPackageInfo` (mirror) with shared 1h cache (500-entry LRU cap) / 搜索（官方npm）+ 元数据（镜像）+ 共享缓存
- `src/api/quality.ts`: `getNpmScores` (shared by data-refresher + quality tool) + `getPackageQualityScore` / 质量分数（共享）
- `src/api/security.ts`: `getPackageVulnerabilities` (returns `checked`) + `findAlternatives` (own-keyword search) / 漏洞检查 + 替代查找
- `src/api/stats.ts`: `getDownloadHistory` (npm downloads API, 429-prone) / 下载历史
- `src/api/compare.ts`, `readme.ts`, `related.ts`, `typescript.ts`: other API-backed tools / 其他 API 工具
- `src/db/queries.ts`: All DB read/write + `getIndexedCount` / 所有数据库读写 + 索引计数
- `src/db/connection.ts`: SQLite connection singleton (lazy init) / SQLite 连接单例
- `src/utils/registry-selector.ts`: `/-/ping`-based mirror probe + selection + diagnostics / 镜像探测与选择
- `src/utils/data-refresher.ts`: `refreshTopPackages` (returns `RefreshResult`, never throws) + `inferCategory` (23 categories) / 刷新 + 分类推断
- `src/utils/image-downloader.ts`: Parallel image localization for README/detail tools / README 图片本地化
- `src/utils/retry.ts`: Shared `retryWithBackoff` (skips 4xx) / 共享重试
- `src/utils/cache-manager.ts`: 30-min DB cache (`top_packages` key) / 30 分钟 DB 缓存

## Testing / 测试

The project includes test utilities in `src/test-tools.ts` for validating database queries. When adding new database queries, add corresponding tests there.

项目在 `src/test-tools.ts` 中包含测试工具，用于验证数据库查询。添加新的数据库查询时，请在其中添加相应的测试。

## MCP Integration / MCP 集成

This server uses the Model Context Protocol SDK (`@modelcontextprotocol/sdk`). Tools are defined in `server.setRequestHandler(ListToolsRequestSchema)` and implemented in `server.setRequestHandler(CallToolRequestSchema)`.

此服务器使用模型上下文协议 SDK（`@modelcontextprotocol/sdk`）。工具在 `server.setRequestHandler(ListToolsRequestSchema)` 中定义，并在 `server.setRequestHandler(CallToolRequestSchema)` 中实现。

When adding new tools / 添加新工具时：
1. Add tool definition to `ListToolsRequestSchema` handler with name, description, and inputSchema / 将工具定义添加到 `ListToolsRequestSchema` 处理器中，包含名称、描述和 inputSchema
2. Add implementation case in `CallToolRequestSchema` handler switch statement / 在 `CallToolRequestSchema` 处理器的 switch 语句中添加实现案例
3. Return results in format: `{ content: [{ type: 'text', text: JSON.stringify(data) }] }` / 以以下格式返回结果：`{ content: [{ type: 'text', text: JSON.stringify(data) }] }`

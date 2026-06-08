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

The server uses **two distinct data sources** that serve different purposes:

服务器使用**两个不同的数据源**，各有不同用途：

1. **npm Registry API** (`src/api/npm.ts`)
   - Used by: `search_packages`, `get_package_detail`
   - Real-time data, always current
   - No local storage required
   - Subject to API rate limits and network latency
   
   **npm 注册表 API** (`src/api/npm.ts`)
   - 使用工具：`search_packages`、`get_package_detail`
   - 实时数据，始终最新
   - 无需本地存储
   - 受 API 速率限制和网络延迟影响

2. **SQLite Database** (`src/db/`)
   - Used by: `get_trending_packages`, `get_top_packages`, `get_weekly_hot`, `get_packages_by_category`, `get_packages_by_date_range`
   - Pre-cached package data for fast rankings and filtering
   - Requires periodic updates (not automated in current implementation)
   - Schema: `packages` table (main cache) + `trending_snapshots` table (for growth calculation)
   
   **SQLite 数据库** (`src/db/`)
   - 使用工具：`get_trending_packages`、`get_top_packages`、`get_weekly_hot`、`get_packages_by_category`、`get_packages_by_date_range`
   - 预缓存的包数据，用于快速排名和过滤
   - 需要定期更新（当前实现未自动化）
   - 模式：`packages` 表（主缓存）+ `trending_snapshots` 表（用于增长计算）

**Why this split?** Search needs real-time data from npm. Rankings/trends need historical data and fast aggregations that the npm API doesn't provide efficiently.

**为什么分开？** 搜索需要来自 npm 的实时数据。排名/趋势需要历史数据和快速聚合，而 npm API 无法高效提供。

### Registry Selection / 注册表选择 (`src/utils/registry-selector.ts`)

On server startup, the system tests multiple npm registries (official + mirrors) and selects the fastest:
- Tests: npm, npmmirror, Tencent cloud, Huawei cloud
- Rechecks every 6 hours automatically via `getSelectedRegistry()`
- Falls back to official npm registry if all checks fail

服务器启动时，系统测试多个 npm 注册表（官方 + 镜像）并选择最快的：
- 测试：npm、npmmirror、腾讯云、华为云
- 通过 `getSelectedRegistry()` 每 6 小时自动重新检查
- 如果所有检查失败，则回退到官方 npm 注册表

**When modifying**: The 6-hour interval prevents excessive network checks. If adding new registry sources, add to `NPM_REGISTRIES` array.

**修改时注意**：6 小时间隔可防止过度的网络检查。如果添加新的注册表源，请添加到 `NPM_REGISTRIES` 数组。

### Database Management / 数据库管理

**Schema location** / **模式位置**: `src/db/schema.sql` (copied to `dist/db/` during build / 构建时复制到 `dist/db/`)

**Connection** / **连接**: Singleton pattern in `src/db/connection.ts` - database is lazily initialized on first query

单例模式在 `src/db/connection.ts` - 数据库在首次查询时懒加载初始化

**Data Population** / **数据填充**: Database tools (`get_trending_packages`, etc.) will return empty results until packages are inserted. Use `npm run insert-test` to populate test data, or implement a collector to fetch and cache real package data.

数据库工具（`get_trending_packages` 等）在插入包数据之前将返回空结果。使用 `npm run insert-test` 填充测试数据，或实现收集器来获取和缓存真实包数据。

**Trending Calculation** / **趋势计算**: Uses `trending_snapshots` table to compare current downloads against historical snapshots. The query in `getTrendingPackages()` calculates growth by subtracting previous snapshot downloads from current downloads.

使用 `trending_snapshots` 表将当前下载量与历史快照进行比较。`getTrendingPackages()` 中的查询通过减去之前快照的下载量来计算增长。

## Key File Purposes / 关键文件用途

- `src/server.ts`: MCP server entrypoint, tool definitions, request routing / MCP 服务器入口点、工具定义、请求路由
- `src/api/npm.ts`: npm registry HTTP client / npm 注册表 HTTP 客户端
- `src/db/queries.ts`: All database read/write operations / 所有数据库读写操作
- `src/db/connection.ts`: SQLite connection singleton / SQLite 连接单例
- `src/utils/registry-selector.ts`: Registry latency testing and selection logic / 注册表延迟测试和选择逻辑

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

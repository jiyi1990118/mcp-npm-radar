# npm Radar - npm 包智能分析 MCP 服务器

[![npm](https://img.shields.io/npm/v/@npm_xiyuan/mcp-npm-radar)](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

[English](./README.md) | **简体中文**

> 🚀 为 Claude Desktop 提供实时 npm 包智能分析，具备高级搜索、排名和趋势分析功能

生产就绪的 MCP 服务器，提供智能 npm 包发现，具有强大的排名、过滤和趋势分析能力。经过性能和可靠性优化，支持 117 个索引包、23 个分类、图片本地化和全面的错误处理。

## ✨ 功能特性

### 核心智能
- 🔍 **智能搜索** - 基于关键词的包搜索，带实时质量评分（固定走官方 npm 注册表）
- 📊 **排行榜** - 发现下载量最高的包（已索引 117 个；每个 DB 响应含 `indexed_count`）
- 🔥 **趋势分析** - 基于历史快照追踪增长趋势
- 📈 **周热榜** - 实时周下载量追踪
- 🏷️ **23 个分类** - 按框架、构建工具、测试、UI库、ORM 等分类浏览（enum 校验）
- 📅 **日期范围筛选** - 精确按发布日期过滤包

### 高级功能
- 🖼️ **图片本地化** - README 图片自动下载到本地路径，便于后续分析
- 📉 **下载统计** - 带重试保护的下载趋势追踪
- 🔷 **TypeScript 支持** - 全面的类型定义检查（内置 vs DefinitelyTyped）
- ⭐ **质量评分** - 多维度质量评估，优先 npm 真实分数，缺失时回退启发式
- 📖 **README 查看器** - 完整文档，图片已本地化
- 🔒 **安全检查** - 漏洞扫描带 `checked` 状态（区分"无漏洞"与"检查失败"）
- 📦 **打包大小分析** - 来自 bundlephobia 的压缩前后大小

### 性能与可靠性
- 💾 **智能缓存** - 30 分钟数据库缓存 + 1 小时 API 缓存（所有工具支持 `forceRefresh`）
- 🔄 **自动刷新** - 每小时后台数据更新（返回 `RefreshResult`，永不抛异常）
- 🛡️ **速率限制保护** - 批量处理 + 指数退避重试（跳过 4xx）
- 📊 **错误统计** - 详细的成功/失败追踪
- ⚡ **并行处理** - 控制并发的速度优化
- 🔀 **三数据通道** - 每种数据类型路由到最可靠的源

## 🚀 快速开始

### 通过 npm 安装

```bash
npm install -g @npm_xiyuan/mcp-npm-radar
```

### 配置 Claude Desktop

添加到 Claude Desktop 配置文件：

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

**重启 Claude Desktop** 即可开始使用 npm 智能工具！

## 🛠️ 可用工具

| 工具 | 描述 | 数据源 | 缓存 |
|------|------|---------|------|
| `search_packages` | 按关键词搜索 npm 包（返回质量/流行度/维护分数） | 官方 npm 注册表 | 1小时 |
| `get_package_detail` | 完整元数据 + README（图片本地化，见[图片本地化](#-图片本地化)） | 镜像注册表 | 1小时 |
| `get_trending_packages` | 基于增长的趋势包（响应含 `indexed_count`） | 数据库 + API | 30分钟 |
| `get_top_packages` | 按总下载量排名的顶级包（响应含 `indexed_count`） | 数据库 + API | 30分钟 |
| `get_weekly_hot` | 按周下载量的热门包（响应含 `indexed_count`） | 数据库 + API | 30分钟 |
| `get_packages_by_category` | 按 23 个分类过滤（enum 校验，响应含 `indexed_count`） | 数据库 + API | 30分钟 |
| `get_packages_by_date_range` | 按发布日期过滤（响应含 `indexed_count`） | 数据库 + API | 30分钟 |
| `compare_packages` | 比较 2-5 个包（minItems/maxItems 强制） | 镜像注册表 | 1小时 |
| `get_bundle_size` | 浏览器打包大小来自 bundlephobia（仅浏览器可打包包） | bundlephobia | 无 |
| `get_package_vulnerabilities` | 漏洞检查（返回 `checked` 布尔；`false`=API失败，非"无漏洞"） | npm 漏洞 API | 无 |
| `find_alternatives` | 查找同用途替代包（基于包自身关键词） | 官方 npm 注册表 | 1小时 |
| `get_related_packages` | 获取生态邻居包（共享关键词/依赖） | 官方 npm 注册表 | 1小时 |
| `get_download_history` | 下载历史与趋势（易限流，暴露 HTTP 429） | npm 下载 API | 1小时 |
| `check_typescript_support` | 内置类型 vs DefinitelyTyped 检查 | 镜像注册表 | 1小时 |
| `get_package_quality_score` | 0-100 分（优先 npm 真实分数，`scoreSource: npm\|heuristic`） | 镜像 + npm 注册表 | 1小时 |
| `get_package_readme` | 完整 README（图片本地化，见[图片本地化](#-图片本地化)） | 镜像注册表 | 1小时 |

### 强制刷新

所有 API 类和数据库类工具都支持 `forceRefresh: true` 来绕过缓存：

```json
search_packages(keyword: "react", forceRefresh: true)
get_package_detail(package_name: "express", forceRefresh: true)
get_trending_packages(limit: 20, forceRefresh: true)
```

`get_bundle_size` 和 `get_package_vulnerabilities` 无共享缓存（始终最新），`forceRefresh` 不适用。

## 🏗️ 架构

### 三数据通道

每种数据类型路由到最适合它的源：

| 通道 | 源 | 原因 |
|---------|--------|-----|
| 包元数据（`GET /<pkg>`） | 最快的镜像 | 大负载；镜像加速 |
| 搜索（`/-/v1/search`） | 仅官方 npm 注册表 | 镜像搜索不可靠（华为云返回 0 结果，npmmirror 缺 `score`） |
| 下载量（`api.npmjs.org/downloads`） | 官方 npm 下载 API | 唯一提供下载统计的主机 |

- **注册表选择**：启动时通过 `GET /-/ping`（~2-38 字节）探测 4 个镜像（npm、npmmirror、腾讯云、华为云），选最快的，每 6 小时复检。全部失败则回退官方 npm。诊断可通过 `checkAllRegistries()` / `getLastRegistryStatuses()`。
- **后台刷新**：`refreshTopPackages()` 每小时运行，分批获取 ~117 个热门包（每批 15 个，500ms 延迟）。返回 `RefreshResult` 且永不抛异常——注册表失败时记录 `[REFRESH_ABORTED]`、仍写缓存时间戳并返回错误。
- **速率限制**：批量处理 + 指数退避重试（3 次重试，跳过 4xx）。下载 API 易限流（429）；`get_package_quality_score` 将下载失败视为非致命。
- **优雅降级**：无历史快照时趋势分析回退到周下载量排序。

### 🖼️ 图片本地化

`get_package_detail` 和 `get_package_readme` 自动本地化 README 中的图片：

1. 提取 `![alt](url)` 和 `<img src>` URL
2. **并行下载**图片（并发 8，单图超时 15s，重试 2 次）
3. 等待**所有**图片完成后再返回完整内容
4. 将每个图片替换为 `![alt](file:///abs/path)<!--IMG {"path":...,"orig":...,"status":"ok"}-->`
5. 失败的图片变为 `<!--IMG {"path":null,"status":"failed","reason":...}-->`（不阻塞响应）

文件保存到 `~/.npm-radar/images/<package>/<sha1(url)>.<ext>`，后续调用复用。响应还包含 `images` 清单数组（`{originalUrl, localPath, status, reason?, alt?}`）。

**下游工具**可通过正则 `<!--IMG\s+(\{.*?\})-->` 定位图片占位符，在原位置回填分析结果。

| 环境变量 | 默认值 | 作用 |
|---|---|---|
| `NPM_RADAR_IMAGE_DIR` | `~/.npm-radar/images` | 图片存储目录 |
| `NPM_RADAR_IMAGE_CONCURRENCY` | `8` | 并行下载工作者数 |
| `NPM_RADAR_IMAGE_TIMEOUT_MS` | `15000` | 单图超时（毫秒） |

### 性能优化

1. **轻量探测**：注册表选择用 `GET /-/ping`（~2-38 字节）而非获取整个包（844KB）
2. **并行处理**：100+ 包以批次方式获取，控制并发
3. **智能重试**：指数退避，跳过 4xx 错误（404 无需重试）
4. **缓存上限**：内存缓存上限 500 条（LRU 淘汰）控制内存
5. **分类推断**：23 个分类，词边界关键词匹配
6. **数据清理**：自动删除过期数据（包保留 7 天，快照保留 30 天）

### 数据覆盖

- **117 个热门包**，涵盖多个分类：
  - 框架：React、Vue、Angular、Svelte、Next.js、Nuxt 等
  - 构建工具：Webpack、Vite、Rollup、esbuild、Turbopack
  - 测试：Jest、Vitest、Cypress、Playwright、Mocha
  - UI 库：Tailwind、MUI、Ant Design、Chakra UI
  - 状态管理：Redux、Zustand、Pinia、Jotai
  - ORM：Prisma、TypeORM、Drizzle、Mongoose
  - 以及更多...

## 📊 质量与可靠性

- ✅ **准确数据**：真实的月度和周度下载量（非估算）
- ✅ **真实质量分数**：优先 npm 搜索 API 分数，回退启发式（`scoreSource` 字段）
- ✅ **全面分类**：23 个分类，词边界关键词匹配
- ✅ **诚实的漏洞状态**：`checked` 布尔区分"无漏洞"与"检查失败"
- ✅ **生产就绪**：广泛的错误处理 + 成功/失败统计
- ✅ **速率限制保护**：内置 API 限流防护

## 📖 开发

```bash
# 克隆仓库
git clone https://github.com/jiyi1990118/mcp-npm-radar.git
cd mcp-npm-radar

# 安装依赖
npm install

# 构建项目
npm run build

# 运行 MCP 服务器
npm start

# 运行测试
npm test
```

## 🗂️ 数据存储

- **数据库位置**：`~/.npm-radar/npmradar.db`
- **自定义路径**：设置 `SQLITE_DB_PATH` 环境变量
- **自动初始化**：首次使用时自动创建数据库和目录
- **索引优化**：在 downloads、category、created_at 和 snapshot_date 上建立索引

## 🆕 近期改进

- 🖼️ **图片本地化**：README 图片并行下载到本地路径，便于后续分析
- 🔀 **三数据通道**：包元数据走镜像、搜索走官方 npm、下载量走 npm 统计 API
- ⚡ **轻量注册表探测**：从 `GET /axios`（844KB）改为 `GET /-/ping`（~2-38 字节）
- 🔄 **全工具 forceRefresh**：所有 API 类和 DB 类工具均支持缓存绕过
- 🛡️ **容错刷新**：`refreshTopPackages` 返回 `RefreshResult`，永不抛异常，部分失败也写缓存
- 🔒 **诚实漏洞状态**：`checked` 字段区分"无漏洞"与"检查失败"
- ⭐ **分数来源透明**：质量分数含 `scoreSource: npm|heuristic`
- 📊 **索引计数**：所有 DB 类工具返回 `indexed_count` 标识数据就绪状态
- 🏷️ **分类枚举**：23 个分类在工具 schema 中 enum 校验
- 🗑️ **清理死代码**：移除 `compareDownloadTrends`/`calculateTrend` 孤儿；抽取共享 `retryWithBackoff`

## 🆕 v1.2.0 新特性

### 性能改进
- 🚀 索引 117 个包（从 15 个提升）
- ⚡ 并行处理使数据刷新速度提升 97%
- 🛡️ 批量处理的速率限制保护
- 🔄 每小时后台自动刷新

### 数据准确性
- ✅ 真实的月度/周度下载数据（非估算）
- ✅ 从 npm API 获取实时质量分数
- ✅ 带历史快照的准确趋势计算

### 增强分类
- 📁 23 个分类（从 3 个提升）：
  - web-framework、meta-framework、backend-framework
  - build-tool、compiler
  - testing、e2e-testing
  - css-framework、ui-library、css-in-js
  - state-management、database、orm
  - http-client、graphql
  - cli-tool、node-utility
  - linting、formatting
  - utility、date-time、validation、types

### 可靠性
- 🔁 指数退避重试机制（跳过 4xx）
- 📊 错误统计追踪（NOT_FOUND vs NETWORK_ERROR）
- 🧹 自动数据清理（7 天包保留，30 天快照）
- 🆘 趋势冷启动支持 + 备选策略

## 📄 许可证

ISC © Xiyuan

## 🔗 链接

- [npm 包](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
- [GitHub 仓库](https://github.com/jiyi1990118/mcp-npm-radar)
- [报告问题](https://github.com/jiyi1990118/mcp-npm-radar/issues)

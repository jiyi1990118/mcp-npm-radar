# npm Radar - npm 包智能分析 MCP 服务器

[![npm](https://img.shields.io/npm/v/@npm_xiyuan/mcp-npm-radar)](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

[English](./README.md) | **简体中文**

> 🚀 为 Claude Desktop 提供实时 npm 包智能分析，具备高级搜索、排名和趋势分析功能

生产就绪的 MCP 服务器，提供智能 npm 包发现，具有强大的排名、过滤和趋势分析能力。经过性能和可靠性优化，支持 100+ 包、20+ 分类和全面的错误处理。

## ✨ 功能特性

### 核心智能
- 🔍 **智能搜索** - 基于关键词的包搜索，带实时质量评分
- 📊 **排行榜** - 发现下载量最高的包（已索引 100+ 个）
- 🔥 **趋势分析** - 基于历史快照追踪增长趋势
- 📈 **周热榜** - 实时周下载量追踪
- 🏷️ **20+ 分类** - 按框架、构建工具、测试、UI库、ORM 等分类浏览
- 📅 **日期范围筛选** - 精确按发布日期过滤包

### 高级功能
- 📉 **下载统计** - 带重试保护的下载趋势追踪
- 🔷 **TypeScript 支持** - 全面的类型定义检查
- ⭐ **质量评分** - 多维度质量评估（流行度 + 维护 + 质量）
- 📖 **README 查看器** - 完整使用说明和文档
- 🔒 **安全检查** - CVE 追踪的漏洞扫描
- 📦 **打包大小分析** - 来自 bundlephobia 的压缩前后大小

### 性能与可靠性
- 💾 **智能缓存** - 30 分钟数据库缓存 + 1 小时 API 缓存
- 🔄 **自动刷新** - 每小时后台数据更新
- 🛡️ **速率限制保护** - 批量处理 + 指数退避重试
- 📊 **错误统计** - 详细的成功/失败追踪
- ⚡ **并行处理** - 控制并发的速度优化

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
| `search_packages` | 按关键词搜索 npm 包 | npm API | 1小时 |
| `get_package_detail` | 获取包的详细信息 | npm API | 1小时 |
| `get_trending_packages` | 基于增长的趋势包 | 数据库 + API | 30分钟 |
| `get_top_packages` | 按月下载量排名的顶级包 | 数据库 + API | 30分钟 |
| `get_weekly_hot` | 按周下载量的热门包 | 数据库 + API | 30分钟 |
| `get_packages_by_category` | 按 20+ 分类过滤 | 数据库 + API | 30分钟 |
| `get_packages_by_date_range` | 按发布日期范围过滤 | 数据库 + API | 30分钟 |
| `compare_packages` | 比较多个包 | npm API | 1小时 |
| `get_bundle_size` | 包打包大小分析 | bundlephobia | 1小时 |
| `get_package_vulnerabilities` | 安全漏洞检查 | npm API | 1小时 |
| `find_alternatives` | 查找替代包 | npm API | 1小时 |
| `get_related_packages` | 获取相关包 | npm API | 1小时 |
| `get_download_history` | 下载统计与趋势 | npm API | 1小时 |
| `check_typescript_support` | TypeScript 定义检查 | npm API | 1小时 |
| `get_package_quality_score` | 综合质量评分 | npm API | 1小时 |
| `get_package_readme` | README 文档 | npm API | 1小时 |

### 强制刷新

所有数据库支持的工具都支持 `forceRefresh: true` 参数来绕过缓存获取实时数据：

```json
get_trending_packages(limit: 20, forceRefresh: true)
get_top_packages(limit: 50, forceRefresh: true)
```

## 🏗️ 架构

### 混合数据架构

生产优化的混合架构，结合实时 API 调用和智能缓存：

- **实时数据**：`search_packages` 和 `get_package_detail` 始终从 npm 注册表获取最新数据
- **智能缓存**：排名和过滤工具使用本地数据库，30 分钟缓存提升性能
- **后台刷新**：每小时自动数据更新保持缓存新鲜
- **速率限制**：批量处理（15 个包/批次）+ 500ms 延迟防止 API 限流
- **错误处理**：指数退避重试机制（3 次重试，1s → 2s → 4s 延迟）
- **优雅降级**：趋势分析在历史数据不可用时使用周下载量作为备选

### 性能优化

1. **并行处理**：100+ 包以批次方式获取，控制并发
2. **请求限流**：下载统计 API 调用间隔 200ms
3. **智能重试**：指数退避 + 错误类型检测（404 vs 网络错误）
4. **分类推断**：20+ 分类的智能关键词匹配
5. **数据清理**：自动删除过期数据（包保留 7 天，快照保留 30 天）

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
- ✅ **真实质量分数**：从 npm 搜索 API 获取（非硬编码）
- ✅ **全面分类**：20+ 分类 vs 之前版本的 3 个
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

## 🆕 v1.2.0 新特性

### 性能改进
- 🚀 索引 100+ 个包（从 15 个提升）
- ⚡ 并行处理使数据刷新速度提升 97%
- 🛡️ 批量处理的速率限制保护
- 🔄 每小时后台自动刷新

### 数据准确性
- ✅ 真实的月度/周度下载数据（非估算）
- ✅ 从 npm API 获取实时质量分数
- ✅ 带历史快照的准确趋势计算

### 增强分类
- 📁 20+ 分类（从 3 个提升）：
  - web-framework、meta-framework、backend-framework
  - build-tool、compiler、bundler
  - testing、e2e-testing
  - css-framework、ui-library、css-in-js
  - state-management、database、orm
  - http-client、graphql
  - cli-tool、node-utility
  - linting、formatting
  - utility、date-time、validation、types

### 可靠性
- 🔁 指数退避重试机制
- 📊 错误统计追踪（NOT_FOUND vs NETWORK_ERROR）
- 🧹 自动数据清理（7 天包保留，30 天快照）
- 🆘 趋势冷启动支持 + 备选策略

## 📄 许可证

ISC © Xiyuan

## 🔗 链接

- [npm 包](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
- [GitHub 仓库](https://github.com/jiyi1990118/mcp-npm-radar)
- [报告问题](https://github.com/jiyi1990118/mcp-npm-radar/issues)

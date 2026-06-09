# npm Radar - npm 包智能分析 MCP 服务器

[![npm](https://img.shields.io/npm/v/@npm_xiyuan/mcp-npm-radar)](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

[English](./README.md) | **简体中文**

> 🚀 为 Claude Desktop 提供实时 npm 包搜索、排名和趋势分析

提供智能 npm 包发现的 MCP 服务器，具有强大的排名、过滤和趋势分析功能。

## ✨ 功能特性

- 🔍 **智能搜索** - 基于关键词的包搜索，带质量评分
- 📊 **排行榜** - 发现下载量最高的包
- 🔥 **趋势分析** - 追踪基于增长的趋势包
- 📈 **周热榜** - 查找周下载量高的热门包
- 🏷️ **分类筛选** - 按分类浏览包
- 📅 **日期范围筛选** - 按发布日期查找包
- 📉 **下载统计** - 追踪下载趋势和历史
- 🔷 **TypeScript 支持** - 检查类型定义可用性
- ⭐ **质量评分** - 综合包质量评估
- 📖 **README 查看器** - 获取完整使用说明和文档
- 💾 **智能缓存** - 1小时智能缓存，优化性能

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
| `get_trending_packages` | 基于增长的趋势包 | 数据库 + API | 1小时 |
| `get_top_packages` | 按总下载量排名的顶级包 | 数据库 + API | 1小时 |
| `get_weekly_hot` | 按周下载量的热门包 | 数据库 + API | 1小时 |
| `get_packages_by_category` | 按分类过滤包 | 数据库 + API | 1小时 |
| `get_packages_by_date_range` | 按发布日期范围过滤 | 数据库 + API | 1小时 |
| `compare_packages` | 并排比较多个包 | npm API | 1小时 |
| `get_bundle_size` | 获取包的打包大小（压缩后） | bundlephobia | 1小时 |
| `get_package_vulnerabilities` | 检查已知安全漏洞 | npm API | 1小时 |
| `find_alternatives` | 查找替代包 | npm API | 1小时 |
| `get_related_packages` | 按关键词获取相关包 | npm API | 1小时 |
| `get_download_history` | 获取下载统计和趋势 | npm API | 1小时 |
| `check_typescript_support` | 检查 TypeScript 类型定义支持 | npm API | 1小时 |
| `get_package_quality_score` | 获取综合质量评估 | npm API | 1小时 |
| `get_package_readme` | 获取 README 使用说明 | npm API | 1小时 |


## 📖 使用示例

### 1️⃣ search_packages

**按关键词搜索包，带质量评分**

**示例 1：搜索 React 相关包**
```
用户："搜索 React UI 组件库"
Claude 将使用：search_packages(keyword: "react ui components", limit: 20)
```

**示例 2：查找测试框架**
```
用户："有哪些流行的测试框架？"
Claude 将使用：search_packages(keyword: "testing framework", limit: 10)
```

**示例 3：搜索特定功能**
```
用户："我需要一个图片压缩的包"
Claude 将使用：search_packages(keyword: "image compression", limit: 15)
```

### 2️⃣ get_package_detail

**获取特定包的详细信息**

**示例 1：查看包详情**
```
用户："告诉我 axios 包的信息"
Claude 将使用：get_package_detail(package_name: "axios")
返回：版本、描述、作者、许可证、仓库、依赖等
```

**示例 2：比较包版本**
```
用户："TypeScript 的最新版本是什么？"
Claude 将使用：get_package_detail(package_name: "typescript")
```

**示例 3：检查依赖**
```
用户："Next.js 有哪些依赖？"
Claude 将使用：get_package_detail(package_name: "next")
```

### 3️⃣ get_trending_packages

**发现高增长率的包**

**示例 1：查找趋势包**
```
用户："现在有哪些 npm 包正在流行？"
Claude 将使用：get_trending_packages(limit: 20)
```

**示例 2：发现新流行工具**
```
用户："显示增长最快的 10 个包"
Claude 将使用：get_trending_packages(limit: 10)
```

**示例 3：追踪生态趋势**
```
用户："JavaScript 生态中什么在变得流行？"
Claude 将使用：get_trending_packages(limit: 30)
```

### 4️⃣ get_top_packages

**查找总下载量最高的包**

**示例 1：顶级包列表**
```
用户："最受欢迎的 npm 包有哪些？"
Claude 将使用：get_top_packages(limit: 50)
```

**示例 2：行业标准**
```
用户："显示下载量前 20 的包"
Claude 将使用：get_top_packages(limit: 20)
```

**示例 3：生态概览**
```
用户："大家都在用什么包？"
Claude 将使用：get_top_packages(limit: 30)
```

### 5️⃣ get_weekly_hot

**查找最近下载活跃度高的包**

**示例 1：本周热门包**
```
用户："本周有哪些热门包？"
Claude 将使用：get_weekly_hot(limit: 50)
```

**示例 2：最近流行度**
```
用户："显示最近下载量高的包"
Claude 将使用：get_weekly_hot(limit: 30)
```

**示例 3：周度趋势**
```
用户："最近 7 天什么包比较热门？"
Claude 将使用：get_weekly_hot(limit: 20)
```

### 6️⃣ get_packages_by_category

**按分类浏览包**

**示例 1：Web 框架**
```
用户："显示 Web 框架包"
Claude 将使用：get_packages_by_category(category: "web-framework", limit: 50)
```

**示例 2：CLI 工具**
```
用户："有哪些流行的命令行工具？"
Claude 将使用：get_packages_by_category(category: "cli-tool", limit: 30)
```

**示例 3：数据库包**
```
用户："查找数据库相关的包"
Claude 将使用：get_packages_by_category(category: "database", limit: 40)
```

### 7️⃣ get_packages_by_date_range

**查找特定日期范围内发布的包**

**示例 1：最近的包**
```
用户："显示 2024 年发布的包"
Claude 将使用：get_packages_by_date_range(
  start_date: "2024-01-01",
  end_date: "2024-12-31",
  limit: 50
)
```

**示例 2：历史包**
```
用户："2020 到 2022 年间发布了哪些包？"
Claude 将使用：get_packages_by_date_range(
  start_date: "2020-01-01",
  end_date: "2022-12-31",
  limit: 100
)
```

**示例 3：年度对比**
```
用户："查找 2023 年的包"
Claude 将使用：get_packages_by_date_range(
  start_date: "2023-01-01",
  end_date: "2023-12-31",
  limit: 50
)
```

## 🏗️ 架构

### 8️⃣ compare_packages

**并排比较多个包**

**示例 1：比较时间库**
```
用户："比较 moment、dayjs 和 date-fns"
Claude 将使用：compare_packages(packages: ["moment", "dayjs", "date-fns"])
返回：下载量、大小、依赖数等多维度对比
```

**示例 2：HTTP 客户端对比**
```
用户："axios、node-fetch 和 got 哪个更好？"
Claude 将使用：compare_packages(packages: ["axios", "node-fetch", "got"])
```

**示例 3：测试框架对比**
```
用户："比较 jest 和 mocha"
Claude 将使用：compare_packages(packages: ["jest", "mocha"])
```

### 9️⃣ get_bundle_size

**获取包的打包大小（压缩前后）**

**示例 1：检查库大小**
```
用户："lodash 有多大？"
Claude 将使用：get_bundle_size(package_name: "lodash")
返回：size: 72KB, gzip: 25KB
```

**示例 2：特定版本大小**
```
用户："React 18 的大小是多少？"
Claude 将使用：get_bundle_size(package_name: "react", version: "18.0.0")
```

**示例 3：优化打包体积**
```
用户："添加 moment 会让我的包体积增加很多吗？"
Claude 将使用：get_bundle_size(package_name: "moment")
```

### 🔟 get_package_vulnerabilities

**检查已知安全漏洞**

**示例 1：安全审计**
```
用户："axios 有安全问题吗？"
Claude 将使用：get_package_vulnerabilities(package_name: "axios")
返回：CVE 列表、严重程度、修复版本
```

**示例 2：特定版本检查**
```
用户："lodash 4.17.20 安全吗？"
Claude 将使用：get_package_vulnerabilities(package_name: "lodash", version: "4.17.20")
```

**示例 3：安装前检查**
```
用户："检查 express 是否有漏洞"
Claude 将使用：get_package_vulnerabilities(package_name: "express")
```

### 1️⃣1️⃣ find_alternatives

**查找功能相似的替代包**

**示例 1：更轻量的替代品**
```
用户："有没有比 moment 更轻的时间库？"
Claude 将使用：find_alternatives(package_name: "moment")
返回：dayjs、date-fns、luxon
```

**示例 2：现代替代品**
```
用户："request 包有什么替代品？"
Claude 将使用：find_alternatives(package_name: "request")
```

**示例 3：性能更好的替代品**
```
用户："找一个比 lodash 更快的替代品"
Claude 将使用：find_alternatives(package_name: "lodash")
```

### 1️⃣2️⃣ get_related_packages

**获取关键词和生态系统相关的包**

**示例 1：React 生态**
```
用户："和 React 配合使用的包有哪些？"
Claude 将使用：get_related_packages(package_name: "react", limit: 10)
返回：react-router、redux、styled-components 等
```

**示例 2：构建工具**
```
用户："webpack 常用的配套包有哪些？"
Claude 将使用：get_related_packages(package_name: "webpack")
```

**示例 3：测试生态**
```
用户："显示和 jest 相关的包"
Claude 将使用：get_related_packages(package_name: "jest", limit: 15)
```

### 1️⃣3️⃣ get_download_history

**获取下载统计和趋势分析**

**示例 1：月度下载趋势**
```
用户："axios 每月有多少下载量？"
Claude 将使用：get_download_history(package_name: "axios", period: "last-month")
返回：总下载量、日均下载量、趋势数据
```

**示例 2：周增长追踪**
```
用户："显示 vite 本周的下载趋势"
Claude 将使用：get_download_history(package_name: "vite", period: "last-week")
```

**示例 3：年度对比**
```
用户："react 的年度下载趋势是什么？"
Claude 将使用：get_download_history(package_name: "react", period: "last-year")
```

### 1️⃣4️⃣ check_typescript_support

**检查包是否有 TypeScript 类型定义**

**示例 1：内置类型检查**
```
用户："axios 支持 TypeScript 吗？"
Claude 将使用：check_typescript_support(package_name: "axios")
返回：内置类型状态、@types 包信息
```

**示例 2：查找类型包**
```
用户："如何给 express 添加 TypeScript 支持？"
Claude 将使用：check_typescript_support(package_name: "express")
```

**示例 3：迁移规划**
```
用户："检查 lodash 的 TypeScript 支持"
Claude 将使用：check_typescript_support(package_name: "lodash")
```

### 1️⃣5️⃣ get_package_quality_score

**获取综合质量评估及详细指标**

**示例 1：整体质量检查**
```
用户："axios 是个高质量的包吗？"
Claude 将使用：get_package_quality_score(package_name: "axios")
返回：总体评分、流行度/维护/质量分数、评级
```

**示例 2：包对比**
```
用户："fastify 的质量评分是多少？"
Claude 将使用：get_package_quality_score(package_name: "fastify")
```

**示例 3：采用前评估**
```
用户："评估 zod 的质量"
Claude 将使用：get_package_quality_score(package_name: "zod")
返回：月下载量、最后发布日期、readme/license/仓库状态
```

### 1️⃣6️⃣ get_package_readme

**获取完整的 README，包含使用说明和 API 文档**

**示例 1：获取使用说明**
```
用户："告诉我 axios 包的信息及具体用法"
Claude 将使用：get_package_readme(package_name: "axios")
返回：完整的 README，包含安装、使用示例、API 文档
```

**示例 2：学习包的 API**
```
用户："显示 express 的文档"
Claude 将使用：get_package_readme(package_name: "express")
```

**示例 3：查看配置选项**
```
用户："webpack 有哪些配置选项？"
Claude 将使用：get_package_readme(package_name: "webpack")
返回：包含所有配置详情的 README
```

## 🏗️ 架构

### 混合数据架构

此 MCP 服务器使用**混合架构**，结合实时 API 调用和智能缓存：

- **实时数据**：`search_packages` 和 `get_package_detail` 从 npm 注册表获取最新数据
- **缓存数据**：排名和过滤工具使用本地数据库，带 1 小时缓存
- **自动刷新**：缓存过期（>1小时）时自动从 npm API 刷新数据
- **智能存储**：数据库存储在 `~/.npm-radar/`（用户主目录）

### 缓存策略

- **TTL**：所有缓存数据的有效期为 1 小时
- **自动更新**：缓存过期时自动触发从 npm API 刷新
- **性能优化**：快速响应排名和趋势，无 API 速率限制

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

## 📄 许可证

ISC © Xiyuan

## 🔗 链接

- [npm 包](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
- [GitHub 仓库](https://github.com/jiyi1990118/mcp-npm-radar)
- [报告问题](https://github.com/jiyi1990118/mcp-npm-radar/issues)

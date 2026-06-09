# npm Radar - npm Package Intelligence MCP Server

[![npm](https://img.shields.io/npm/v/@npm_xiyuan/mcp-npm-radar)](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

**English** | [简体中文](./README.zh-CN.md)

> 🚀 Real-time npm package search, rankings, and trend analysis for Claude Desktop

MCP server providing intelligent npm package discovery with powerful ranking, filtering, and trend analysis capabilities.

## ✨ Features

- 🔍 **Smart Search** - Keyword-based package search with quality scores
- 📊 **Top Rankings** - Discover most downloaded packages
- 🔥 **Trending Analysis** - Track growth-based trending packages
- 📈 **Weekly Hot List** - Find hot packages by weekly downloads
- 🏷️ **Category Filter** - Browse packages by category
- 📅 **Date Range Filter** - Find packages by publish date
- 📉 **Download Statistics** - Track download trends and history
- 🔷 **TypeScript Support** - Check type definitions availability
- ⭐ **Quality Scoring** - Comprehensive package quality assessment
- 📖 **README Viewer** - Get complete usage instructions and documentation
- 💾 **Smart Cache** - 1-hour intelligent caching for optimal performance

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
| `get_trending_packages` | Growth-based trending packages | Database + API | 1 hour |
| `get_top_packages` | Top packages by total downloads | Database + API | 1 hour |
| `get_weekly_hot` | Hot packages by weekly downloads | Database + API | 1 hour |
| `get_packages_by_category` | Filter packages by category | Database + API | 1 hour |
| `compare_packages` | Compare multiple packages side-by-side | npm API | 1 hour |
| `get_bundle_size` | Get package bundle size (minified & gzipped) | bundlephobia | 1 hour |
| `get_package_vulnerabilities` | Check for known security vulnerabilities | npm API | 1 hour |
| `find_alternatives` | Find alternative packages | npm API | 1 hour |
| `get_related_packages` | Get related packages by keywords | npm API | 1 hour |
| `get_packages_by_date_range` | Filter by publish date range | Database + API | 1 hour |
| `get_download_history` | Get download statistics and trends | npm API | 1 hour |
| `check_typescript_support` | Check TypeScript type definitions support | npm API | 1 hour |
| `get_package_quality_score` | Get comprehensive quality assessment | npm API | 1 hour |
| `get_package_readme` | Get README with usage instructions | npm API | 1 hour |

## 📖 Usage Examples

### 1️⃣ search_packages

**Search packages by keyword with quality scoring**

**Example 1: Search for React-related packages**
```
User: "Search for React UI component libraries"
Claude will use: search_packages(keyword: "react ui components", limit: 20)
```

**Example 2: Find testing frameworks**
```
User: "What are the popular testing frameworks?"
Claude will use: search_packages(keyword: "testing framework", limit: 10)
```

**Example 3: Search for specific functionality**
```
User: "I need a package for image compression"
Claude will use: search_packages(keyword: "image compression", limit: 15)
```

### 2️⃣ get_package_detail

**Get comprehensive information about a specific package**

**Example 1: Check package details**
```
User: "Tell me about the 'axios' package"
Claude will use: get_package_detail(package_name: "axios")
Returns: version, description, author, license, repository, dependencies, etc.
```

**Example 2: Compare package versions**
```
User: "What's the latest version of TypeScript?"
Claude will use: get_package_detail(package_name: "typescript")
```

**Example 3: Check dependencies**
```
User: "What dependencies does Next.js have?"
Claude will use: get_package_detail(package_name: "next")
```

### 3️⃣ get_trending_packages

**Discover packages with high growth rates**

**Example 1: Find trending packages**
```
User: "What npm packages are trending right now?"
Claude will use: get_trending_packages(limit: 20)
```

**Example 2: Discover new popular tools**
```
User: "Show me the top 10 fastest-growing packages"
Claude will use: get_trending_packages(limit: 10)
```

**Example 3: Track ecosystem trends**
```
User: "What's gaining popularity in the JavaScript ecosystem?"
Claude will use: get_trending_packages(limit: 30)
```

### 4️⃣ get_top_packages

**Find most downloaded packages overall**

**Example 1: Top packages list**
```
User: "What are the most popular npm packages?"
Claude will use: get_top_packages(limit: 50)
```

**Example 2: Industry standards**
```
User: "Show me the top 20 most downloaded packages"
Claude will use: get_top_packages(limit: 20)
```

**Example 3: Ecosystem overview**
```
User: "What packages does everyone use?"
Claude will use: get_top_packages(limit: 30)
```

### 5️⃣ get_weekly_hot

**Find packages with high recent download activity**

**Example 1: This week's hot packages**
```
User: "What packages are hot this week?"
Claude will use: get_weekly_hot(limit: 50)
```

**Example 2: Recent popularity**
```
User: "Show me packages with high recent downloads"
Claude will use: get_weekly_hot(limit: 30)
```

**Example 3: Weekly trending**
```
User: "What's popular in the last 7 days?"
Claude will use: get_weekly_hot(limit: 20)
```

### 6️⃣ get_packages_by_category

**Browse packages filtered by category**

**Example 1: Web frameworks**
```
User: "Show me web framework packages"
Claude will use: get_packages_by_category(category: "web-framework", limit: 50)
```

**Example 2: CLI tools**
```
User: "What are the popular command-line tools?"
Claude will use: get_packages_by_category(category: "cli-tool", limit: 30)
```

**Example 3: Database packages**
```
User: "Find database-related packages"
Claude will use: get_packages_by_category(category: "database", limit: 40)
```

### 7️⃣ get_packages_by_date_range

**Find packages published within a specific date range**

**Example 1: Recent packages**
```
User: "Show me packages published in 2024"
Claude will use: get_packages_by_date_range(
  start_date: "2024-01-01",
  end_date: "2024-12-31",
  limit: 50
)
```

**Example 2: Historical packages**
```
User: "What packages were released between 2020 and 2022?"
Claude will use: get_packages_by_date_range(
  start_date: "2020-01-01",
  end_date: "2022-12-31",
  limit: 100
)
```

**Example 3: Year comparison**
```
User: "Find packages from 2023"
Claude will use: get_packages_by_date_range(
  start_date: "2023-01-01",
  end_date: "2023-12-31",
  limit: 50
)
```


## 🏗️ Architecture

### 8️⃣ compare_packages

**Compare multiple packages side-by-side**

**Example 1: Compare time libraries**
```
User: "Compare moment, dayjs, and date-fns"
Claude will use: compare_packages(packages: ["moment", "dayjs", "date-fns"])
Returns: Side-by-side comparison of downloads, size, dependencies, etc.
```

**Example 2: HTTP clients comparison**
```
User: "Which is better: axios, node-fetch, or got?"
Claude will use: compare_packages(packages: ["axios", "node-fetch", "got"])
```

**Example 3: Testing frameworks**
```
User: "Compare jest and mocha"
Claude will use: compare_packages(packages: ["jest", "mocha"])
```

### 9️⃣ get_bundle_size

**Get package bundle size (minified and gzipped)**

**Example 1: Check library size**
```
User: "How big is lodash?"
Claude will use: get_bundle_size(package_name: "lodash")
Returns: size: 72KB, gzip: 25KB
```

**Example 2: Version-specific size**
```
User: "What's the size of React 18?"
Claude will use: get_bundle_size(package_name: "react", version: "18.0.0")
```

**Example 3: Optimize bundle**
```
User: "Will adding moment increase my bundle size a lot?"
Claude will use: get_bundle_size(package_name: "moment")
```

### 🔟 get_package_vulnerabilities

**Check for known security vulnerabilities**

**Example 1: Security audit**
```
User: "Does axios have any security issues?"
Claude will use: get_package_vulnerabilities(package_name: "axios")
Returns: List of CVEs, severity levels, patched versions
```

**Example 2: Version-specific check**
```
User: "Is lodash 4.17.20 safe?"
Claude will use: get_package_vulnerabilities(package_name: "lodash", version: "4.17.20")
```

**Example 3: Pre-installation check**
```
User: "Check if express has vulnerabilities"
Claude will use: get_package_vulnerabilities(package_name: "express")
```

### 1️⃣1️⃣ find_alternatives

**Find alternative packages with similar functionality**

**Example 1: Lighter alternatives**
```
User: "Is there a lighter alternative to moment?"
Claude will use: find_alternatives(package_name: "moment")
Returns: dayjs, date-fns, luxon
```

**Example 2: Modern replacements**
```
User: "What can I use instead of request?"
Claude will use: find_alternatives(package_name: "request")
```

**Example 3: Performance alternatives**
```
User: "Find faster alternatives to lodash"
Claude will use: find_alternatives(package_name: "lodash")
```

### 1️⃣2️⃣ get_related_packages

**Get packages related by keywords and ecosystem**

**Example 1: React ecosystem**
```
User: "What packages work well with React?"
Claude will use: get_related_packages(package_name: "react", limit: 10)
Returns: react-router, redux, styled-components, etc.
```

**Example 2: Build tools**
```
User: "What's commonly used with webpack?"
Claude will use: get_related_packages(package_name: "webpack")
```

**Example 3: Testing ecosystem**
```
User: "Show me packages related to jest"
Claude will use: get_related_packages(package_name: "jest", limit: 15)
```

### 1️⃣3️⃣ get_download_history

**Get download statistics and trend analysis**

**Example 1: Monthly download trends**
```
User: "How many downloads does axios get per month?"
Claude will use: get_download_history(package_name: "axios", period: "last-month")
Returns: total downloads, daily average, trend data
```

**Example 2: Weekly growth tracking**
```
User: "Show me vite's download trends this week"
Claude will use: get_download_history(package_name: "vite", period: "last-week")
```

**Example 3: Year-over-year comparison**
```
User: "What's the annual download trend for react?"
Claude will use: get_download_history(package_name: "react", period: "last-year")
```

### 1️⃣4️⃣ check_typescript_support

**Check if a package has TypeScript type definitions**

**Example 1: Built-in types check**
```
User: "Does axios have TypeScript support?"
Claude will use: check_typescript_support(package_name: "axios")
Returns: built-in types status, @types package info
```

**Example 2: Find types package**
```
User: "How do I get types for express?"
Claude will use: check_typescript_support(package_name: "express")
```

**Example 3: Migration planning**
```
User: "Check TypeScript support for lodash"
Claude will use: check_typescript_support(package_name: "lodash")
```

### 1️⃣5️⃣ get_package_quality_score

**Get comprehensive quality assessment with detailed metrics**

**Example 1: Overall quality check**
```
User: "Is axios a quality package?"
Claude will use: get_package_quality_score(package_name: "axios")
Returns: overall score, popularity/maintenance/quality scores, rating
```

**Example 2: Package comparison**
```
User: "What's the quality score of fastify?"
Claude will use: get_package_quality_score(package_name: "fastify")
```

**Example 3: Pre-adoption evaluation**
```
User: "Evaluate the quality of zod"
Claude will use: get_package_quality_score(package_name: "zod")
Returns: monthly downloads, last publish date, readme/license/repo status
```

### 1️⃣6️⃣ get_package_readme

**Get complete README with usage instructions and API documentation**

**Example 1: Get usage instructions**
```
User: "Tell me about axios package information and how to use it"
Claude will use: get_package_readme(package_name: "axios")
Returns: complete README with installation, usage examples, API docs
```

**Example 2: Learn package API**
```
User: "Show me the documentation for express"
Claude will use: get_package_readme(package_name: "express")
```

**Example 3: Check configuration options**
```
User: "What are the configuration options for webpack?"
Claude will use: get_package_readme(package_name: "webpack")
Returns: README with all configuration details
```

## 🏗️ Architecture

### Hybrid Data Architecture

This MCP server uses a **hybrid architecture** combining real-time API calls and intelligent caching:

- **Real-time Data**: `search_packages` and `get_package_detail` fetch fresh data from npm registry
- **Cached Data**: Ranking and filtering tools use a local database with 1-hour cache
- **Auto-refresh**: Data automatically refreshes when cache expires (>1 hour)
- **Smart Storage**: Database stored in `~/.npm-radar/` (user home directory)

### Cache Strategy

- **TTL**: 1 hour for all cached data
- **Auto-update**: Expired cache triggers automatic refresh from npm API
- **Performance**: Fast responses for rankings and trends without API rate limits

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

## 📄 License

ISC © Xiyuan

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
- [GitHub Repository](https://github.com/jiyi1990118/mcp-npm-radar)
- [Report Issues](https://github.com/jiyi1990118/mcp-npm-radar/issues)

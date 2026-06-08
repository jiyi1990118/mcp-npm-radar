# npm Radar - npm Package Intelligence MCP Server

[![npm](https://img.shields.io/npm/v/@npm_xiyuan/mcp-npm-radar)](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

> 🚀 Real-time npm package search, rankings, and trend analysis for Claude Desktop

MCP server for npm package discovery with powerful ranking and filtering capabilities.

## ✨ Features

- 🔍 **Package Search** - Search packages by keyword
- 📊 **Rankings** - Top packages by downloads
- 🔥 **Trending** - Growth analysis and hot packages
- 🏷️ **Category Filter** - Filter by package category
- 📅 **Date Range** - Filter by publish date
- 📈 **Weekly Hot** - Hot packages by weekly downloads

## 🚀 Quick Start

### Install via npm

```bash
npm install -g @npm_xiyuan/mcp-npm-radar
```

### Configure Claude Desktop

Add to your config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

Restart Claude Desktop and start using npm intelligence tools!

## 🛠️ Available Tools (7 total)

| Tool | Description | Data Source |
|------|-------------|-------------|
| `search_packages` | Search npm packages by keyword | npm API (real-time) |
| `get_package_detail` | Get detailed package information | npm API (real-time) |
| `get_trending_packages` | Growth-based trending packages | Database |
| `get_top_packages` | Top packages by total downloads | Database |
| `get_weekly_hot` | Hot packages by weekly downloads | Database |
| `get_packages_by_category` | Filter packages by category | Database |
| `get_packages_by_date_range` | Filter by publish date range | Database |

## 📖 Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Start server
npm start
```

## 📄 License

ISC © Xiyuan

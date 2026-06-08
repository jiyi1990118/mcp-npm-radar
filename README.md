# npm Radar - npm Package Intelligence MCP Server

[![npm](https://img.shields.io/npm/v/@npm_xiyuan/mcp-npm-radar)](https://www.npmjs.com/package/@npm_xiyuan/mcp-npm-radar)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

> 🚀 Real-time npm package intelligence for Claude Desktop and MCP clients

MCP server providing comprehensive npm package analysis, search, comparison, and security auditing capabilities.

## ✨ Features

- 🔍 **Advanced Search** - Search packages with filters
- 📊 **Package Analysis** - Detailed package information
- ⚖️ **Comparison** - Compare multiple packages
- 🔒 **Security Audit** - Vulnerability scanning
- 📦 **Dependency Analysis** - Analyze dependency trees
- 🎯 **Smart Recommendations** - AI-powered package suggestions

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

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `search_packages` | Search npm packages |
| `get_package_detail` | Get package details |
| `compare_packages` | Compare packages |
| `audit_package` | Security audit |
| `get_package_dependencies` | Dependency analysis |

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

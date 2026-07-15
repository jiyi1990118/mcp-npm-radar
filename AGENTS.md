# AGENTS.md

Compact guidance for OpenCode sessions working in this repo. Read alongside `CLAUDE.md` (which has the bilingual architecture overview) - this file captures only what an agent would likely miss or get wrong.

## Commands

```bash
npm run build        # tsc -> copy-sql -> chmod +x dist/server.js   (REQUIRED before test/start)
npm run dev          # tsx src/server.ts (no build needed)
npm start            # node dist/server.js  (build first)
npm test             # node dist/test-tools.js  (build first; hits LIVE npm APIs, not a unit suite)
npm run insert-test  # node dist/insert-test-data.js  (seed 10 fake packages + snapshots)
```

- No `lint` / `typecheck` script exists. Verification = `npm run build` (tsc runs in `strict`).
- `npm test` is a smoke-test script, not a framework. It calls live npm registry + download APIs, so it can fail on network/rate limits and is not hermetic. It also triggers `refreshTopPackages()` which fetches ~117 real packages.
- Required order when touching code: `build -> test` (test runs compiled output from `dist/`).

## Build gotcha: copy-sql is load-bearing

`npm run build` runs `tsc && npm run copy-sql && chmod +x dist/server.js`. The `copy-sql` step copies `src/db/*.sql` to `dist/db/`. At runtime `connection.ts` reads `schema.sql` from `__dirname` (= `dist/db/`), so skipping `copy-sql` makes every DB-backed tool crash on first query. If you add/renamed SQL files, update the `copy-sql` glob (`cp src/db/*.sql dist/db/`).

## TypeScript / ESM conventions

- `"type": "module"` + `module/moduleResolution: Node16` + `strict`. `rootDir: src`, `outDir: dist`.
- **Imports in `.ts` files MUST use `.js` extensions** (e.g. `from './db/queries.js'`). This is NodeNext ESM resolution - the file is `.ts` but the specifier is `.js`. Forgetting the extension breaks the build.
- Every src file also compiles to `.d.ts` + `.map`. New files under `src/` are picked up automatically by `tsconfig` (`include: ["src/**/*"]`).

## Database reality (docs are misleading)

- **Real DB path**: `process.env.SQLITE_DB_PATH` OR `~/.npm-radar/npmradar.db` (see `src/db/connection.ts:18`). Created lazily on first query; schema applied from `dist/db/schema.sql`.
- `.env.example` says `SQLITE_DB_PATH=./npmradar.db` and the repo root contains stray `npmradar.db` / `modelradar.db` files - these are gitignored leftovers. The server does NOT read `DB_TYPE`, `CACHE_TTL`, or `LOG_LEVEL` from `.env` (those in `.env.example` are unused; only `SQLITE_DB_PATH` and `NPM_REGISTRY_URL` are referenced, and `NPM_REGISTRY_URL` is not actually consumed - registry selection is runtime-tested, see below).
- `better-sqlite3` is a native module; `npm install` compiles it. If build/install fails on Apple Silicon, ensure Xcode CLT is present.
- DB-backed tools (`get_trending_packages`, `get_top_packages`, `get_weekly_hot`, `get_packages_by_category`, `get_packages_by_date_range`) return empty until data is inserted. Use `npm run insert-test` for deterministic fake data, or wait for the hourly background refresh (`refreshTopPackages`) to populate real data.

## Image localization (README + detail tools)

`get_package_readme` and `get_package_detail` localize images found in README markdown via `src/utils/image-downloader.ts`:
- Extracts `![alt](url)` and `<img src>` URLs, downloads in parallel (concurrency 8, per-image timeout 15s, 2 retries), waits for ALL to settle, then returns complete content.
- Each image is replaced inline by `![alt](file:///abs/path)<!--IMG {"path":...,"orig":...,"status":"ok","alt":...}-->` on success. Downstream tools locate the `<!--IMG {...}-->` JSON marker (regex `<\!--IMG\s+(\{.*?\})-->` then `JSON.parse`) to backfill image-analysis results at that position.
- Failures do NOT block: a failed image becomes `<!--IMG {"path":null,"status":"failed","reason":...,"orig":...}-->` and the rest of the content is still returned.
- Files are saved to `~/.npm-radar/images/<sanitized-pkg>/<sha1(url16)>.<ext>` and reused on subsequent calls (no re-download). Non-http(s) URLs (e.g. data URIs, relative) are left in place and marked `status:"skipped"` in the `images` manifest.
- Both tools also return a top-level `images` array (manifest of `{originalUrl, localPath, status, reason?, alt?}`) alongside the localized `readme` field.

| Var | Effect |
|---|---|
| `NPM_RADAR_IMAGE_DIR` | Override image storage base dir (default `~/.npm-radar/images`) |
| `NPM_RADAR_IMAGE_CONCURRENCY` | Parallel download workers (default `8`) |
| `NPM_RADAR_IMAGE_TIMEOUT_MS` | Per-image timeout ms (default `15000`) |

## Architecture facts that change how you work

- **Two data sources, not one**: npm Registry API (`src/api/`) for search/detail/compare/security; SQLite (`src/db/`) for rankings/trends. See `CLAUDE.md` for the full split.
- **All 5 DB-backed tools share one cache key** (`'top_packages'`, 30min TTL in `src/utils/cache-manager.ts`). Any of them triggers the same `refreshTopPackages()` when cache is stale - there is no per-tool refresh.
- **The 5 DB-backed tools return `indexed_count`** (total packages in the DB) alongside `count`/`packages`. If `indexed_count` is 0, the DB hasn't been populated yet - results are empty because data isn't indexed, not because nothing matched. These tools only ever see the ~117 hardcoded `POPULAR_PACKAGES`; for broad discovery use `search_packages`.
- **Download counts bypass the selected registry.** `data-refresher.ts` and `src/api/stats.ts` / `compare.ts` hardcode `https://api.npmjs.org/downloads/...` because the npm *download* API is only on the official host. Registry mirror selection (`registry-selector.ts`) only affects package metadata + search. Don't "fix" these to use the mirror - they'll 404. The download API is also rate-limit-prone (429); `get_package_quality_score` treats download-history failure as non-fatal, but `get_download_history` surfaces 429 directly.
- **Three data channels, each routed to the right source**: package metadata (`getPackageInfo`, `GET /<pkg>`) uses the fastest selected mirror; search (`searchPackages`, `/-/v1/search`) is pinned to the **official npm registry** because mirror search implementations are unreliable (huawei returns 0 results, npmmirror omits `score`); download counts (`api.npmjs.org/downloads`) are always official (only host that serves them). Do not "unify" these onto the selected mirror - search and downloads will break.
- **Registry selection**: on startup the server probes 4 mirrors via `GET /-/ping` (~2-38 bytes, not the old `GET /axios` which downloaded 844KB), picks the fastest, and rechecks every 6h via `getSelectedRegistry()`. Falls back to official npm if all fail. `checkAllRegistries()` / `getLastRegistryStatuses()` expose per-mirror latency+ok for diagnostics. Add new mirrors to `NPM_REGISTRIES` in `registry-selector.ts`.
- **Trending cold start**: if `trending_snapshots` is empty, `getTrendingPackages()` falls back to ordering by `weekly_downloads` (see `src/db/queries.ts`). Snapshots are written by `refreshTopPackages()` / `saveSnapshot()`.
- **Popular-packages list is hardcoded** in `data-refresher.ts` (`POPULAR_PACKAGES`, ~117 entries). Refreshed in batches of 15 with 500ms delay. To index more packages, edit that array - there is no dynamic discovery.
- **Shared helpers**: `retryWithBackoff` lives in `src/utils/retry.ts` (skips 4xx, used by `data-refresher.ts` + `stats.ts`). `getNpmScores` lives in `src/api/quality.ts` and is shared by `data-refresher.ts` (DB storage) and the `get_package_quality_score` tool (prefers real npm scores, falls back to a heuristic - check the `scoreSource` field). `inferCategory` is exported from `data-refresher.ts` for testing.
- **`refreshTopPackages` returns a `RefreshResult`** (`{success, failed, total, error?}`) and never throws - if registry selection fails it logs `[REFRESH_ABORTED]`, still sets the cache timestamp (so DB tools don't retry on every call), and returns the error in the result. The DB-backed tools call it when cache is stale; they get partial data rather than crashing.
- **All API-backed tools support `forceRefresh`** (search/detail/compare/alternatives/related/ts-support/quality/readme), mirroring the DB-backed tools. It bypasses the 1h in-memory cache in `npm.ts`. `get_bundle_size` and `get_package_vulnerabilities` don't need it (they call bundlephobia / the advisory API directly, no shared cache).
- **`get_package_vulnerabilities` returns `checked: boolean`**: `true` = the advisory API responded (0+ vulns); `false` = the check failed (network/timeout) - do NOT read `false` as "no vulnerabilities". `find_alternatives` uses the package's own keywords via the cached `searchPackages` (the old `keywords:<pkg>-alternative` query was broken and returned ~0).

## Adding an MCP tool

Tools are defined inline in `src/server.ts` (not in the empty `src/tools/` dir). The pattern:
1. Add the tool definition to the `ListToolsRequestSchema` handler (name, description, `inputSchema` with `required`).
2. Add a `case` in the `CallToolRequestSchema` switch.
3. Return `{ content: [{ type: 'text', text: JSON.stringify({ success: true, ... }, null, 2) }] }`. Errors: `{ content: [...], isError: true }` (the outer try/catch already wraps this).
4. Implement logic in `src/api/` (npm-backed) or `src/db/queries.ts` (DB-backed). API helpers reuse the in-memory 1h cache in `npm.ts` via `getCached()`.

`src/tools/` and `src/collectors/` are empty placeholders - don't assume code lives there.

## Known stale bits (don't be fooled)

- `package.json` declares `"bin": { "npmradar": "dist/cli.js" }` but there is **no `src/cli.ts`**. Only `mcp-npm-radar` (-> `dist/server.js`) is a real bin. The `npmradar` bin entry will fail if invoked.
- `src/test.ts` and `src/test-mcp-tools.ts` are orphan scripts not wired to any npm script. The active test entrypoint is `src/test-tools.ts`.
- `README.md` mentions "~/.npm-radar/npmradar.db" (correct for runtime) but `.env.example` defaults to `./npmradar.db` (would only apply if you set the env var). Trust `connection.ts`.

## Env vars actually consumed

| Var | Where | Effect |
|---|---|---|
| `SQLITE_DB_PATH` | `src/db/connection.ts:18` | Override DB location |
| `NPM_REGISTRY_URL` | nowhere | Declared in `.env.example` but **not read** - registry is chosen at runtime |
| `DB_TYPE` / `CACHE_TTL` / `LOG_LEVEL` | nowhere | In `.env.example`, unused. Cache TTLs are hardcoded (30min DB, 1h API). |
| `NPM_RADAR_IMAGE_DIR` / `NPM_RADAR_IMAGE_CONCURRENCY` / `NPM_RADAR_IMAGE_TIMEOUT_MS` | `src/utils/image-downloader.ts` | Image localization for README/detail tools (see "Image localization" section) |

`dotenv` is a dependency but `src/server.ts` never calls `config()` - env vars are read via `process.env` directly, so load `.env` yourself (or rely on the shell) if you need them.

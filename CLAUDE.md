# CLAUDE.md - Project Guide for openapi-spec

## Project Overview

**openapi-spec** is the up-to-date OpenAPI specification layer: reader types for Swagger 2.0 and
OpenAPI 3.0, 3.1 and 3.2, version detection and profiles, the operation walker, and the
Swagger 2.0 to OpenAPI 3.0 converter. It is being extracted from the `src/spec/` layer of
[mcp-from-openapi](https://github.com/agentfront/mcp-from-openapi), which will depend on it.

Status: `0.0.1` reserves the npm name and exports nothing. The first functional release is `1.0.0` (release line `release/1.0.x`).

## Development Commands

```bash
corepack yarn install     # global yarn is 1.x; the repo pins yarn 4 (packageManager)
corepack yarn test        # Jest
corepack yarn test:coverage
corepack yarn typecheck
corepack yarn build       # CJS (dist/index.js) + ESM (dist/esm/index.mjs) + declarations
```

## Build and Publish

- esbuild builds CJS and ESM separately (`--packages=external`); tsc emits declarations from
  `tsconfig.lib.json`.
- `yarn build` copies `package.json`, `README.md` and `LICENSE` into `dist/`, and
  `scripts/strip-dist-from-pkg.js` rewrites the `./dist/` paths and removes `scripts`.
  The package is published FROM `dist/` (`npm publish ./dist`), never from the root.

- Releases: `docs/releasing.md`. Prepare Release opens `release-pr/vX.Y.Z` into `release/X.Y.x`;
  merging it runs Publish Release (`publish-release.yml`, environment `release`, npm trusted publishing:
  the file name and environment are part of the npm configuration, never rename them). No npm token.
- Never commit `.npmrc`, `.env*` or packed `*.tgz` (all git-ignored); the repository is public.

## Testing

- Jest 30 with `@swc/jest`, V8 coverage, 100% threshold on statements, branches, functions, lines.
- Unit tests in `src/__tests__/*.spec.ts`.

## Pinned OpenAPI Sources and Spec Watch

- `e2e/fixtures/oas/` vendors the official OAI JSON Schemas, JSON Schema meta-schemas and OAI test
  documents byte-for-byte; `e2e/fixtures/oas/sources.json` pins each (`sources`: url + sha256;
  `upstream`: the OAI branch and folders each commit came from). Provenance and licences:
  `e2e/fixtures/README.md`, `e2e/fixtures/NOTICES.md`.
- `scripts/sync-oas-sources.mjs`: offline verify (`yarn verify:sources`, a CI step), `--update`
  (re-download), `--latest [--json]` (read-only: what is newer upstream; exit 0 nothing, 3 something, 1 error).
- `.github/workflows/spec-watch.yml` runs `--latest` weekly (Wed 06:23 UTC) and keeps ONE issue
  `OpenAPI sources: newer versions available` up to date. Runbook: `docs/maintaining-openapi-support.md`.

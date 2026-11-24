# CLAUDE.md - Project Guide for openapi-spec

## Project Overview

**openapi-spec** is the up-to-date OpenAPI specification layer: reader types for Swagger 2.0 and
OpenAPI 3.0, 3.1 and 3.2, version detection and profiles, the operation walker, and the
Swagger 2.0 to OpenAPI 3.0 converter. It was extracted from the `src/spec/` layer of
[mcp-from-openapi](https://github.com/agentfront/mcp-from-openapi), which will depend on it.

Status: `0.0.1` on npm reserves the name and exports nothing. The code on `main` ships as `1.0.0`,
the first functional release (release line `release/1.0.x`).

## Key Files

| File | Purpose |
| --- | --- |
| `src/index.ts` | The public API (the barrel). Everything exported is public: changing a name or a type is a breaking change |
| `src/types/*` | Reader types, written from the specification text and the OAI JSON Schemas: namespaces `OAS20` (`v2_0.ts`, root `SwaggerObject`), `OAS30`, `OAS31`, `OAS32` (`v3_2.ts` states only its changes to 3.1 via `Override`), the cross-version unions of 3.x (`index.ts`; `OAS20` is not in them), `SchemaOrBoolean`, `WithExtensions` for `x-` fields, shared `SpecMap` / `FreeFormValue` / `Override` (`common.ts`), JSON Schema 2020-12 keywords. Types only: excluded from coverage |
| `src/versions.ts` | `detectSpecVersion` (status, `family`; `swagger: "2.0"` is family `2.0`), `isSwagger2`, one `SpecProfile` per known `major.minor` in `SPEC_PROFILES` (each value cites the schema pointer it comes from), `resolveOperationLayout` (THE decision of which operations a document has), `SPEC_FEATURES` / `featureNewerThanDeclared`, `securitySchemeProblem`, `listSkippedNewerOperations`. Adding 3.3 = a family, a profile, its features |
| `src/operations.ts` | `ownProperty` / `setOwnProperty` (THE reading and writing of a document-chosen key: never through the prototype, `__proto__` is an own key), `listOperations` / `getOperation` (the one walker of a Path Item: fixed methods in `STANDARD_METHODS` order, then `additionalOperations` by key; a diagnostic per ignored value), `isHttpToken`, `wireMethod`, `isRefusedMethod` |
| `src/upgrade-v2.ts` | `upgradeSwagger2`: a DEREFERENCED Swagger 2.0 document to OpenAPI 3.0.3. Total (never throws), pure (input never mutated) and linear (explicit stacks), bounded by `MAX_MEDIA_TYPES_PER_LIST` and `MAX_CONVERSION_ENTRIES` (`tooLarge`); findings grouped, one diagnostic per kind |
| `src/schema-references.ts` | `wrapReferenceSiblings`: in 3.1+ a Schema Object's `$ref` with constraints beside it moves into `allOf` (last), so dereferencing does not drop the siblings |
| `src/parameters.ts` | `readParameterName` (a number or boolean name is its text + `PARAMETER_NAME_NOT_STRING`), `withTextName`, `pathTemplateNames` |
| `src/diagnostics.ts` | `SpecDiagnostic`, `SPEC_DIAGNOSTIC_CODES`, `diagnosticKey`; `describeValue` / `jsonPointer` / `appendPointer` make document text safe to print (control, bidirectional and invisible characters as `\uXXXX`, long text cut) |

## Conventions

- **No Node.js API**: `tsconfig.json` compiles `src` with `types: []`; tests use `tsconfig.test.json`.
- **Reader types**: they describe documents code reads, so a validator, not the compiler, rejects an
  invalid document. Enumerations are open (`'query' | (string & {})`), maps are `SpecMap<T>`, free-form
  values `FreeFormValue`, no index signatures.
- **Diagnostics, never throws**: reading a malformed document returns findings with a JSON Pointer
  `path`; nothing is dropped silently. Untrusted text reaches a message only through `describeValue`.
- **Operation discovery follows the declared version** (`resolveOperationLayout`); everything else
  follows features. The patch number never matters.

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
- Unit tests in `src/__tests__/*.spec.ts`, inline documents only. SWC strips types without checking
  them, so `yarn typecheck` compiles the tests too (`tsconfig.test.json`).

## Pinned OpenAPI Sources and Spec Watch

- `e2e/fixtures/oas/` vendors the official OAI JSON Schemas, JSON Schema meta-schemas and OAI test
  documents byte-for-byte; `e2e/fixtures/oas/sources.json` pins each (`sources`: url + sha256;
  `upstream`: the OAI branch and folders each commit came from). Provenance and licences:
  `e2e/fixtures/README.md`, `e2e/fixtures/NOTICES.md`.
- `scripts/sync-oas-sources.mjs`: offline verify (`yarn verify:sources`, a CI step), `--update`
  (re-download), `--latest [--json]` (read-only: what is newer upstream; exit 0 nothing, 3 something, 1 error).
- `.github/workflows/spec-watch.yml` runs `--latest` weekly (Wed 06:23 UTC) and keeps ONE issue
  `OpenAPI sources: newer versions available` up to date. Runbook: `docs/maintaining-openapi-support.md`.

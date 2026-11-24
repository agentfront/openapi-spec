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
| `src/finding-kind.ts` | Internal (not exported from the package): `findingKind`, the converter's grouping key, in one linear pass with the same result as `/"(?:[^"\\]\|\\.)*"/g` (which is quadratic on an unclosed string; CodeQL `js/polynomial-redos`). Its test compares it with that expression over every string up to 7 characters |
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
- E2E stories: `e2e/*.e2e.ts` under `jest.e2e.config.js` (`yarn test:e2e`, a CI step; never under
  coverage). The bare specifier `openapi-spec` maps onto `src/index.ts` (`moduleNameMapper` and the
  `paths` of `e2e/tsconfig.json`).
- **Schema-to-types parity** (`e2e/spec-types-parity.e2e.ts`, helpers `e2e/helpers/oas-schema.ts`,
  `oas-validate.ts`, `tsc.ts`): `OAS20`/`OAS30`/`OAS31`/`OAS32` declare exactly the fields of the
  official OAI JSON Schemas (required-ness, value kinds, maps, `x-` keys in maps); every schema definition
  is mapped to a type or listed as unmapped with a reason; every exported object type rejects a string,
  a number, a boolean and an array (`primitiveAccepts`, compiled with the real compiler). A deviation
  needs a per-version allowlist entry with its reason, and a stale entry fails. It also checks the
  vendored checksums, the official 2.0 example documents against the official 2.0 schema, two pinned
  verdicts of that schema on operations the 2.0 text forbids, and the package boundary: the library in
  `src` (not its `__tests__`) refers to no module outside `src`.
- **Official documents** (`e2e/official-documents.e2e.ts`): every OAI test document vendored under
  `e2e/fixtures/oas/documents`. Each PASS document validates against its official schema, type-checks as
  an `OAS20.SwaggerObject` / `OAS3x.OpenAPIObject` literal (`x-` keys removed), is read by
  `detectSpecVersion` as supported with no diagnostic, and `listOperations` (with
  `resolveOperationLayout`) finds exactly its pinned operations, in order, ignoring nothing
  (`e2e/expected/official-operations.json`, `<method> <path>`, written from the documents: derived from
  mcp-from-openapi's pinned tools, never from this package's output). A single-file 2.0 document
  converts (`upgradeSwagger2`) into one the official 3.0 schema accepts, with no 2.0-only root field and
  its input unchanged; the multi-file `petstore-separate` is not converted (no dereferencer here). Each
  FAIL document is rejected by the schema and read by every function without a throw. `KNOWN_GAPS`
  lists what does not hold yet; each entry is asserted to still fail exactly as listed, so it only shrinks.
- **Type tests** (`e2e/types/*.types.ts`, see its README): the public types as a consumer sees them,
  importing `openapi-spec`; compiled by `yarn typecheck`, never run. `rejections`, `swagger2` and the end of
  `extensions` hold code that must NOT compile, each marked `// @ts-expect-error` with exactly one reason
  to fail (an unused directive is itself an error); `shapes` states required keys and field types as
  `Expect<Equal<...>>` assertions.

## Pinned OpenAPI Sources and Spec Watch

- `e2e/fixtures/oas/` vendors the official OAI JSON Schemas, JSON Schema meta-schemas and OAI test
  documents byte-for-byte; `e2e/fixtures/oas/sources.json` pins each (`sources`: url + sha256;
  `upstream`: the OAI branch and folders each commit came from). Provenance and licences:
  `e2e/fixtures/README.md`, `e2e/fixtures/NOTICES.md`.
- `scripts/sync-oas-sources.mjs`: offline verify (`yarn verify:sources`, a CI step), `--update`
  (re-download), `--latest [--json]` (read-only: what is newer upstream; exit 0 nothing, 3 something, 1 error).
- `.github/workflows/spec-watch.yml` runs `--latest` weekly (Wed 06:23 UTC) and keeps ONE issue
  `OpenAPI sources: newer versions available` up to date. Runbook: `docs/maintaining-openapi-support.md`.

<div align="center">

# openapi-spec

**Up-to-date TypeScript types and readers for OpenAPI 3.2, 3.1, 3.0 and Swagger 2.0,<br/>written from the specification and held to the official OpenAPI JSON Schemas.**

[![npm version](https://img.shields.io/npm/v/openapi-spec?color=cb3837&logo=npm)](https://www.npmjs.com/package/openapi-spec)
[![npm downloads](https://img.shields.io/npm/dm/openapi-spec?logo=npm)](https://www.npmjs.com/package/openapi-spec)
[![CI](https://github.com/agentfront/openapi-spec/actions/workflows/push.yml/badge.svg)](https://github.com/agentfront/openapi-spec/actions/workflows/push.yml)
[![Spec watch](https://github.com/agentfront/openapi-spec/actions/workflows/spec-watch.yml/badge.svg)](https://github.com/agentfront/openapi-spec/actions/workflows/spec-watch.yml)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.2%20%7C%203.1%20%7C%203.0%20%7C%20Swagger%202.0-6BA539?logo=openapiinitiative&logoColor=white)](https://spec.openapis.org/oas/)
[![TypeScript](https://img.shields.io/badge/TypeScript-types%20included-3178C6?logo=typescript&logoColor=white)](https://www.npmjs.com/package/openapi-spec)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://github.com/agentfront/openapi-spec/blob/main/LICENSE)

[Install](#install) · [Quick start](#quick-start) · [Why openapi-spec](#why-openapi-spec) · [Supported versions](#supported-versions) · [API](#api-overview) · [Roadmap](#roadmap) · [FAQ](#faq)

</div>

---

> [!IMPORTANT]
> **Early release.** `openapi-spec@0.0.1` on npm reserves the name and exports nothing yet. The API on this page, extracted from [mcp-from-openapi](https://github.com/agentfront/mcp-from-openapi), is on `main` and ships as **1.0.0**, the first stable release. Watch the repository (*Watch → Custom → Releases*) to hear when it lands.

`openapi-spec` is the OpenAPI specification layer for TypeScript and JavaScript tools: **types for every OpenAPI version**, **version detection**, **one walker for the operations of a path item**, and a **Swagger 2.0 to OpenAPI 3.0 converter**. It's built for API tooling: code generators, linters, gateways, documentation sites, SDK builders and AI agents that read OpenAPI documents.

## Why openapi-spec

- **Every version in one package.** Swagger 2.0, OpenAPI 3.0, 3.1 and 3.2, each in its own namespace (`OAS20`, `OAS30`, `OAS31`, `OAS32`), plus cross-version unions such as `OpenAPIDocument` and `OperationObject` for code that reads any 3.x document.
- **OpenAPI 3.2 today.** The `query` method, `additionalOperations` (custom HTTP methods), `$self`, `in: querystring`, streaming `itemSchema` and the rest of 3.2 are typed and read.
- **Written from the specification, held to the official schemas.** The types come from the specification text and the OpenAPI Initiative's own JSON Schemas. A parity test compares every field with those schemas: required or optional, value kinds, maps. Any deliberate difference is listed with its reason.
- **Kept up to date automatically.** A weekly [spec watch](#how-it-stays-up-to-date) compares the pinned official sources with [spec.openapis.org](https://spec.openapis.org/oas/) and the [OAI repository](https://github.com/OAI/OpenAPI-Specification), and opens an issue when a new schema iteration, release or version branch appears. It has already flagged OpenAPI 3.3 development (`v3.3-dev`).
- **Reader types for real documents.** Enumerations stay open (`'query' | 'header' | (string & {})`), there are no index signatures that would reject your own interfaces, and `x-` extensions are read through `WithExtensions`.
- **More than types.** Detect a document's version and what it allows, list its operations the way that version defines them, and upgrade Swagger 2.0 to OpenAPI 3.0.3.
- **Safe on untrusted input.** Document keys are read as own properties only, so `__proto__` and `constructor` are just keys. The converter never throws and never mutates its input. It runs in linear time with explicit stacks and a bounded output size, so one small document can't exhaust memory. Messages and JSON Pointers escape control and invisible characters.
- **Zero runtime dependencies.** CommonJS and ESM builds, declarations included, `sideEffects: false`, Node.js 22.19 or newer.

## Install

```bash
npm install openapi-spec
# or
yarn add openapi-spec
# or
pnpm add openapi-spec
```

## Quick start

> The examples below are the **1.0.0** API.

### Type an OpenAPI document

```ts
import type { OAS32, OpenAPIDocument } from 'openapi-spec';

const petstore: OAS32.OpenAPIObject = {
  openapi: '3.2.0',
  info: { title: 'Petstore', version: '1.0.0' },
  paths: {
    '/pets': {
      get: { operationId: 'listPets', responses: { '200': { description: 'All pets' } } },
      query: { operationId: 'searchPets', responses: { '200': { description: 'Matching pets' } } },
    },
  },
};

// Code that reads any OpenAPI 3.x document takes the cross-version union
function title(document: OpenAPIDocument): string {
  return document.info.title;
}
```

### Detect the version and list operations

```ts
import { detectSpecVersion, jsonPointer, listOperations, resolveOperationLayout } from 'openapi-spec';

const version = detectSpecVersion(document);
// version.status: 'supported' | 'newer-minor' | 'unsupported' | 'malformed' | 'missing'
// version.family: '2.0' | '3.0' | '3.1' | '3.2' (the rules the document is read with)

const layout = resolveOperationLayout(version);
for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
  const { operations, diagnostics } = listOperations(pathItem, { layout, pointer: jsonPointer('paths', path) });
  for (const { method, operation, source } of operations) {
    console.log(method, path, operation.operationId, source); // 'query' '/pets' 'searchPets' 'fixed'
  }
}
```

The layout follows the declared version. A 3.2 document's `query` and `additionalOperations` are read, while the same fields in a 3.1 document are not, because 3.1 doesn't define them. A filter written for the classic methods can't be bypassed by a method the document's version doesn't have.

### Convert Swagger 2.0 to OpenAPI 3.0

```ts
import { isSwagger2, upgradeSwagger2 } from 'openapi-spec';

if (isSwagger2(swagger)) {
  // `swagger` must be dereferenced first (no $ref left)
  const { document, diagnostics } = upgradeSwagger2(swagger, {
    documentUri: 'https://api.example.com/swagger.json', // supplies host and scheme when the document has none
  });
  document.openapi; // '3.0.3'
  for (const finding of diagnostics) console.warn(finding.code, finding.path, finding.message);
}
```

The conversion covers `host` / `basePath` / `schemes` to `servers`, `consumes` / `produces` to `content`, body and `formData` parameters to `requestBody`, `collectionFormat` to `style` / `explode`, `type: file`, `x-nullable`, every OAuth2 flow, and `definitions` / `securityDefinitions` to `components`. Anything it can't convert exactly is reported as a diagnostic with a JSON Pointer into the 2.0 document. Nothing is dropped silently.

## Supported versions

| Version | Types | Detection and rules | Operations read | Swagger 2.0 conversion |
| --- | --- | --- | --- | --- |
| **OpenAPI 3.2** | `OAS32` | ✅ `SPEC_PROFILES['3.2']` | `get` `put` `post` `delete` `options` `head` `patch` `trace` `query` + `additionalOperations` | n/a |
| **OpenAPI 3.1** | `OAS31` | ✅ `SPEC_PROFILES['3.1']` | the eight classic methods | n/a |
| **OpenAPI 3.0** | `OAS30` | ✅ `SPEC_PROFILES['3.0']` | the eight classic methods | n/a |
| **Swagger 2.0** | `OAS20` | ✅ `SPEC_PROFILES['2.0']` | `get` `put` `post` `delete` `options` `head` `patch` | ✅ to OpenAPI 3.0.3 |
| Newer 3.x (3.3, ...) | read as the latest | ✅ status `newer-minor` + a diagnostic | as the latest version | n/a |

The patch number never matters: a document is read by the rules of its declared `major.minor`.

## API overview

| Area | Exports | What it does |
| --- | --- | --- |
| **Types** | `OAS20`, `OAS30`, `OAS31`, `OAS32`, `OpenAPIDocument`, `OperationObject`, `ParameterObject`, `SchemaObject`, `SchemaOrBoolean`, `WithExtensions`, ... | Reader types for every version and the cross-version unions |
| **Versions** | `detectSpecVersion`, `isSwagger2`, `SPEC_PROFILES`, `getSpecProfile`, `SPEC_FEATURES`, `isFeatureAvailable`, `featureNewerThanDeclared`, `SUPPORTED_SPEC_VERSIONS`, `LATEST_SPEC_FAMILY` | What a document declares, and what each version allows: methods, parameter locations, required fields, which version introduced a feature |
| **Operations** | `listOperations`, `getOperation`, `resolveOperationLayout`, `STANDARD_METHODS`, `isHttpToken`, `wireMethod` | The one walker of a Path Item: fixed methods in a stable order, then `additionalOperations`, with a diagnostic for every value it ignores |
| **Swagger 2.0** | `upgradeSwagger2`, `readSwagger2BasePath`, `UPGRADED_OPENAPI_VERSION`, `MAX_CONVERSION_ENTRIES` | Total, pure and bounded conversion to OpenAPI 3.0.3 |
| **Schema references** | `wrapReferenceSiblings` | In 3.1+, a `$ref` with sibling constraints moves into `allOf` before dereferencing, which would otherwise drop the siblings |
| **Diagnostics** | `SPEC_DIAGNOSTIC_CODES`, `SpecDiagnostic`, `jsonPointer`, `appendPointer`, `describeValue` | Stable codes, JSON Pointer paths, and document text made safe to print |

## How it stays up to date

Every source it's held to is vendored and pinned by sha256 in [`e2e/fixtures/oas/sources.json`](https://github.com/agentfront/openapi-spec/blob/main/e2e/fixtures/oas/sources.json). That's 152 files: the official JSON Schemas of every version, the JSON Schema meta-schemas they use, and the OpenAPI Initiative's own pass and fail test documents.

- **CI** checks every vendored file against its checksum on every push.
- **The [spec watch](https://github.com/agentfront/openapi-spec/actions/workflows/spec-watch.yml)** runs every Wednesday. It looks for newer schema iterations, unpinned versions, moved test documents, release tags and `v<major>.<minor>-dev` branches, and keeps one issue up to date with what it found.
- **The [maintainer runbook](https://github.com/agentfront/openapi-spec/blob/main/docs/maintaining-openapi-support.md)** lists the steps from a finding to a release.

## Roadmap

- [x] **0.0.1**: name reserved, repository, CI, release pipeline (npm trusted publishing with provenance), weekly spec watch
- [ ] **1.0.0**: types, version profiles, the operation walker and the Swagger 2.0 converter, extracted from mcp-from-openapi with their tests: schema-to-types parity and the official OAI documents
- [ ] [mcp-from-openapi](https://github.com/agentfront/mcp-from-openapi) depends on `openapi-spec`
- [ ] OpenAPI 3.3 as soon as the OpenAPI Initiative publishes it

## FAQ

### Does openapi-spec support OpenAPI 3.2?

Yes. OpenAPI 3.2 has its own types (`OAS32`) and rules (`SPEC_PROFILES['3.2']`), and its operation fields `query` and `additionalOperations` are read for documents that declare 3.2.

### How do I convert Swagger 2.0 to OpenAPI 3 in TypeScript?

Dereference the document, then call `upgradeSwagger2(document)`. You get an OpenAPI 3.0.3 document and a list of diagnostics for anything that couldn't be converted exactly. See [Convert Swagger 2.0 to OpenAPI 3.0](#convert-swagger-20-to-openapi-30).

### Does it validate documents or resolve `$ref`?

Not in 1.0.0. The package reads, detects and converts. Use a dereferencer such as [`@apidevtools/json-schema-ref-parser`](https://www.npmjs.com/package/@apidevtools/json-schema-ref-parser) first. For validation, generation and loading with SSRF protection, see [mcp-from-openapi](https://github.com/agentfront/mcp-from-openapi).

### Why are the types "reader types"?

They describe documents your code **reads**. A document from the outside world can be anything, so the types never claim more than the specification guarantees. Enumerations stay open to unknown values, maps may hold `undefined`, and there are no index signatures, so a document typed with your own interfaces is still accepted.

### Is this the official OpenAPI package?

No. `openapi-spec` is an independent open-source project by [AgentFront](https://github.com/agentfront). It isn't affiliated with or endorsed by the [OpenAPI Initiative](https://www.openapis.org/), whose published schemas and test documents it pins and follows.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](https://github.com/agentfront/openapi-spec/blob/main/CONTRIBUTING.md) and the [Code of Conduct](https://github.com/agentfront/openapi-spec/blob/main/CODE_OF_CONDUCT.md) first. Report security issues privately, as described in [SECURITY.md](https://github.com/agentfront/openapi-spec/blob/main/SECURITY.md).

## License

[Apache-2.0](https://github.com/agentfront/openapi-spec/blob/main/LICENSE) © [AgentFront](https://github.com/agentfront). The vendored OpenAPI Initiative and JSON Schema sources keep their own licences: see [`e2e/fixtures/README.md`](https://github.com/agentfront/openapi-spec/blob/main/e2e/fixtures/README.md).

<div align="center">

**If openapi-spec saves you from chasing the OpenAPI specification yourself, give it a ⭐**

</div>

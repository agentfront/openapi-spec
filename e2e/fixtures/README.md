# Pinned OpenAPI Sources

The official sources this repository is held to, vendored byte-for-byte under `oas/` and pinned by checksum. How to check and move them: [Maintaining OpenAPI Support](../../docs/maintaining-openapi-support.md).

The OpenAPI Initiative's own JSON Schemas for Swagger 2.0 and OpenAPI 3.0, 3.1 and 3.2, plus the JSON Schema meta-schemas they depend on (draft-04 for 2.0 and 3.0's own schema, 2020-12 for 3.1 and 3.2), vendored byte-for-byte and pinned by checksum. They are the source of truth the spec types are written against (every field in the official schema exists in the types, and the types add nothing the schema lacks) and for validating OpenAPI and Swagger documents. Unit tests never read them.

[`oas/sources.json`](./oas/sources.json) is the manifest, `{ "upstream": { ... }, "sources": [ ... ] }`:

- **`sources`** is a flat list of `{ id, version, kind, url, path, sha256 }` entries (152 today), where `path` is relative to `oas/`. The same format pins the OAI test documents below (kinds `document-pass` and `document-fail`, URLs at a fixed commit): each source is a URL, a path and a checksum.
- **`upstream`** says where the test documents came from, which the entries alone do not: `repository` (`OAI/OpenAPI-Specification`), `documents` (one row per pinned commit, `{ commit, version, ref?, folders, note? }`: `ref` is the OAI branch the commit was taken from, absent for a frozen pin such as the 2.0 examples, and `folders` are the folders taken from it) and `acknowledgedBranches` (development branches already known and deliberately not pinned). Verification checks that the table and the entries agree: every source on `raw.githubusercontent.com` is under a row's commit and one of its folders, and every row explains a source, so a pin moved without its row fails. `--latest` follows each `ref`. See [Maintaining OpenAPI Support](../../docs/maintaining-openapi-support.md#the-pinned-sources).

| File (under `oas/`) | Source | Pinned iteration | Retrieved | License | Size |
| ------------------- | ------ | ---------------- | --------- | ------- | ---- |
| `schemas/2.0/schema.json` | [Swagger 2.0 schema](https://spec.openapis.org/oas/2.0/schema/2017-08-27) (JSON Schema draft-04, `id` `http://swagger.io/v2/schema.json#`) | `2017-08-27` | 2026-11-17 | Apache-2.0 ([upstream LICENSE](https://github.com/OAI/OpenAPI-Specification/blob/e77481c73e1c703c7de2e4249047b42b8e9b56f4/LICENSE)) | ~40 KB |
| `schemas/3.0/schema.json` | [OAS 3.0 schema](https://spec.openapis.org/oas/3.0/schema/2024-10-18) (JSON Schema draft-04) | `2024-10-18` | 2026-11-17 | Apache-2.0 ([upstream LICENSE](https://github.com/OAI/OpenAPI-Specification/blob/main/LICENSE)) | ~36 KB |
| `schemas/3.1/schema.json` | [OAS 3.1 schema](https://spec.openapis.org/oas/3.1/schema/2026-11-05) | `2026-11-05` | 2026-11-17 | Apache-2.0 | ~33 KB |
| `schemas/3.1/schema-base.json` | [OAS 3.1 schema-base](https://spec.openapis.org/oas/3.1/schema-base/2026-11-05) | `2026-11-05` | 2026-11-17 | Apache-2.0 | ~0.7 KB |
| `schemas/3.1/dialect.json` | [OAS 3.1 dialect](https://spec.openapis.org/oas/3.1/dialect/2024-11-10) | `2024-11-10` | 2026-11-17 | Apache-2.0 | ~1 KB |
| `schemas/3.1/meta.json` | [OAS 3.1 meta](https://spec.openapis.org/oas/3.1/meta/2024-11-10) | `2024-11-10` | 2026-11-17 | Apache-2.0 | ~2 KB |
| `schemas/3.2/schema.json` | [OAS 3.2 schema](https://spec.openapis.org/oas/3.2/schema/2026-11-12) | `2026-11-12` | 2026-11-17 | Apache-2.0 | ~41 KB |
| `schemas/3.2/schema-base.json` | [OAS 3.2 schema-base](https://spec.openapis.org/oas/3.2/schema-base/2026-11-12) | `2026-11-12` | 2026-11-17 | Apache-2.0 | ~0.7 KB |
| `schemas/3.2/dialect.json` | [OAS 3.2 dialect](https://spec.openapis.org/oas/3.2/dialect/2026-02-26) | `2026-02-26` | 2026-11-17 | Apache-2.0 | ~1 KB |
| `schemas/3.2/meta.json` | [OAS 3.2 meta](https://spec.openapis.org/oas/3.2/meta/2026-02-26) | `2026-02-26` | 2026-11-17 | Apache-2.0 | ~2.5 KB |

All of the above are published by [OAI/OpenAPI-Specification](https://github.com/OAI/OpenAPI-Specification) and vendored unmodified, so no license text is reproduced (see [NOTICES.md](./NOTICES.md)). `schema` describes documents without validating Schema Objects; `schema-base` wraps it and also validates Schema Objects against the OAS dialect; `dialect` and `meta` are that dialect and its base vocabulary (3.1 and 3.2 only; 2.0 and 3.0 are single draft-04 schemas). The published 2.0 schema is byte-identical to `schemas/v2.0/schema.json` at commit `e77481c73e1c703c7de2e4249047b42b8e9b56f4` of that repository, the commit the 2.0 documents below are pinned to.

Two things to know when compiling the 2.0 schema. It `$ref`s fifteen JSON pointers into the draft-04 meta-schema by URL (`http://json-schema.org/draft-04/schema#/properties/title`, ...), so the meta-schema is vendored too (next section) and has to be registered under that URL. And Ajv's strict schema mode refuses it: `additionalItems` sits next to an `items` that is not an array (in `vendorExtension` and `parametersList`), where it does nothing, so compile with `strictSchema: false`.

## JSON Schema draft-04 meta-schema

The Swagger 2.0 schema `$ref`s the draft-04 meta-schema by URL, so it is pinned here as well. Ajv's own copy (`ajv-draft-04/dist/refs/json-schema-draft-04.json`) is not the official file (it adds `format: uri` to `id` and `$schema` and leaves out the `format` property), the same reason as for 2020-12 below. The URL is not dated, so the `sha256` in the manifest is the pin. At retrieval the file was byte-identical to `schema.json` of [json-schema-org/json-schema-spec](https://github.com/json-schema-org/json-schema-spec) at commit `dba92b702c94858162f653590230e7573c8b7dd0` (2017-10-15), which is the commit that [json-schema-org/website](https://github.com/json-schema-org/website) (the repository that serves json-schema.org) pins as its `_includes/draft-04` submodule at commit `a2d03f7db807a759aa6bc61a8792e5452dc996e8` (its `public/draft-04/schema` is a symlink to it), and to the head of the `draft-04` branch of the first repository (`955d185db846cfca84269d9d711b10f4f3353d38`).

| File (under `oas/`) | Source | Pinned URL | Retrieved | License | Size |
| ------------------- | ------ | ---------- | --------- | ------- | ---- |
| `schemas/json-schema-draft-04/schema.json` | [JSON Schema draft-04 meta-schema](https://json-schema.org/draft-04/schema) | `https://json-schema.org/draft-04/schema` | 2026-11-17 | BSD-3-Clause (or AFL-3.0; [upstream LICENSE](https://github.com/json-schema-org/website/blob/a2d03f7db807a759aa6bc61a8792e5452dc996e8/LICENSE)) | ~4.4 KB |

The `draft-04` branch carries no LICENSE file. The LICENSE of the website repository at the commit above (the repository that publishes the file) is the same text as the one of `json-schema-spec` cited for 2020-12 below (byte for byte, 11,739 bytes: the BSD 3-clause license followed by the AFL-3.0 text), so the file is redistributed unmodified under the BSD 3-clause option, whose notice is reproduced in [NOTICES.md](./NOTICES.md).

## JSON Schema 2020-12 meta-schemas

The OpenAPI 3.1 and 3.2 schemas are JSON Schema 2020-12 documents and their dialects `$ref` its schema, which in turn `$ref`s the vocabulary meta-schemas. They are pinned here instead of being read from `node_modules/ajv`, an unpinned copy that is not the official file (ajv 8.20.0 adds a `$vocabulary` member to `meta/core`). The URLs are not dated, so the `sha256` in the manifest is the pin. At retrieval every file was byte-identical to the same file on the `2020-12` branch of [json-schema-org/json-schema-spec](https://github.com/json-schema-org/json-schema-spec) (commit `601a66c8b0f25246bf0e1fb488c5b5f030a79b72`).

| File (under `oas/`) | Source | Pinned URL | Retrieved | License | Size |
| ------------------- | ------ | ---------- | --------- | ------- | ---- |
| `schemas/json-schema-2020-12/schema.json` | [JSON Schema 2020-12 schema](https://json-schema.org/draft/2020-12/schema) | `https://json-schema.org/draft/2020-12/schema` | 2026-11-17 | BSD-3-Clause (or AFL-3.0; [upstream LICENSE](https://github.com/json-schema-org/json-schema-spec/blob/4e87b9141e62483383987ddbd27947f1c484b905/LICENSE)) | ~2.5 KB |
| `schemas/json-schema-2020-12/meta/core.json` | [core vocabulary](https://json-schema.org/draft/2020-12/meta/core) | `https://json-schema.org/draft/2020-12/meta/core` | 2026-11-17 | BSD-3-Clause | ~1.5 KB |
| `schemas/json-schema-2020-12/meta/applicator.json` | [applicator vocabulary](https://json-schema.org/draft/2020-12/meta/applicator) | `https://json-schema.org/draft/2020-12/meta/applicator` | 2026-11-17 | BSD-3-Clause | ~1.5 KB |
| `schemas/json-schema-2020-12/meta/unevaluated.json` | [unevaluated vocabulary](https://json-schema.org/draft/2020-12/meta/unevaluated) | `https://json-schema.org/draft/2020-12/meta/unevaluated` | 2026-11-17 | BSD-3-Clause | ~0.4 KB |
| `schemas/json-schema-2020-12/meta/validation.json` | [validation vocabulary](https://json-schema.org/draft/2020-12/meta/validation) | `https://json-schema.org/draft/2020-12/meta/validation` | 2026-11-17 | BSD-3-Clause | ~2.7 KB |
| `schemas/json-schema-2020-12/meta/meta-data.json` | [meta-data vocabulary](https://json-schema.org/draft/2020-12/meta/meta-data) | `https://json-schema.org/draft/2020-12/meta/meta-data` | 2026-11-17 | BSD-3-Clause | ~0.8 KB |
| `schemas/json-schema-2020-12/meta/format-annotation.json` | [format-annotation vocabulary](https://json-schema.org/draft/2020-12/meta/format-annotation) | `https://json-schema.org/draft/2020-12/meta/format-annotation` | 2026-11-17 | BSD-3-Clause | ~0.3 KB |
| `schemas/json-schema-2020-12/meta/content.json` | [content vocabulary](https://json-schema.org/draft/2020-12/meta/content) | `https://json-schema.org/draft/2020-12/meta/content` | 2026-11-17 | BSD-3-Clause | ~0.4 KB |

The upstream repository is licensed under either the BSD 3-clause license or the Academic Free License v3.0 ([LICENSE](https://github.com/json-schema-org/json-schema-spec/blob/4e87b9141e62483383987ddbd27947f1c484b905/LICENSE) at `main` commit `4e87b9141e62483383987ddbd27947f1c484b905`, © 2022 JSON Schema Specification Authors; the `2020-12` branch carries no LICENSE file and its README says "AFL or BSD"). The files are redistributed unmodified under the BSD 3-clause option, which requires its notice to accompany them, so the text is reproduced verbatim in [NOTICES.md](./NOTICES.md).

## OpenAPI Initiative test documents

The OAI's own schema test documents (and, for Swagger 2.0, its example documents), vendored byte-for-byte under `oas/documents/<version>/{pass,fail}/<name>.yaml` and pinned to a full commit SHA in the URL of each manifest entry (ids `oas-<version>-doc-<pass|fail>-<name>`, kinds `document-pass` / `document-fail`). OAI's own suite (`tests/schema/schema.test.mjs` on the 3.1 and 3.2 branches, `_archive_/schemas/v3.0/schema.test.mjs` on `main`) requires every `pass` document to validate against its schema and every `fail` document (3.1 and 3.2 only) to be rejected by `schema-base`. The official-documents story (`e2e/official-documents.e2e.ts`, with `e2e/helpers/oas-validate.ts`) repeats that check offline, then reads each document with the package: its types, `detectSpecVersion`, `listOperations` against the operations pinned in `e2e/expected/official-operations.json`, the Swagger 2.0 conversion, and a run of every function over the FAIL documents. Unit tests never read them.

| Files (under `oas/documents/`) | Source | Pinned commit | Commit date | Retrieved | License | Count |
| ------------------------------ | ------ | ------------- | ----------- | --------- | ------- | ----- |
| `3.2/pass/*.yaml`, `3.2/fail/*.yaml` | [OAI/OpenAPI-Specification](https://github.com/OAI/OpenAPI-Specification) branch `v3.2-dev`, `tests/schema/pass` and `tests/schema/fail` | `6d86f6560681d0c461cd06b3faa80814aa120fda` | 2026-11-12 | 2026-11-17 | Apache-2.0 ([upstream LICENSE](https://github.com/OAI/OpenAPI-Specification/blob/main/LICENSE)) | 37 pass, 31 fail |
| `3.1/pass/*.yaml`, `3.1/fail/*.yaml` | same repository, branch `v3.1-dev`, `tests/schema/pass` and `tests/schema/fail` | `642ee90575f60233302ad3e82f9de83e02996532` | 2026-11-12 | 2026-11-17 | Apache-2.0 | 35 pass, 12 fail |
| `3.0/pass/*.yaml` | same repository, branch `main`, `_archive_/schemas/v3.0/pass` (the archive has no `fail` documents) | `4f86429f134f7e48b6351563549b4502fc69de52` | 2026-10-18 | 2026-11-17 | Apache-2.0 | 6 pass |
| `2.0/pass/*.yaml`, `2.0/pass/petstore-separate/**` | same repository, `examples/v2.0/yaml` (the Swagger 2.0 example documents; the folder was removed from this repository in `18bf2771eb98f19cdcb1c23d45d8c2a1f49a54d8`, "Remove examples folder", so the pin is its parent) | `e77481c73e1c703c7de2e4249047b42b8e9b56f4` | 2024-10-29 | 2026-11-17 | Apache-2.0 ([upstream LICENSE](https://github.com/OAI/OpenAPI-Specification/blob/e77481c73e1c703c7de2e4249047b42b8e9b56f4/LICENSE)) | 7 documents and the 5 files of the multi-file `petstore-separate` (12 files; no `fail` documents exist for 2.0) |

All are vendored unmodified, so no license text is reproduced (see [NOTICES.md](./NOTICES.md)). The 2.0 documents are the YAML variants of `api-with-examples`, `petstore`, `petstore-expanded`, `petstore-minimal`, `petstore-simple`, `petstore-with-external-docs` and `uber`, and the `petstore-separate` tree with its folders intact (`spec/swagger.yaml` is the root; it reaches `spec/Pet.yaml`, `spec/NewPet.yaml`, `spec/parameters.yaml#/tagsParam` and `common/Error.yaml` with relative `$ref`s, so it is read from disk, not from a string). Of the 2.0 documents, the eight that are whole documents (the seven and `petstore-separate/spec/swagger.yaml`) validate against the pinned official 2.0 schema; the other four files are fragments of the multi-file tree and are not documents. Only the first level of `2.0/pass/` holds single-file documents: `petstore-separate/` is a tree.

**Which source for the 2.0 documents.** The same 24 files (12 YAML, 12 JSON) are also published in [OAI/learn.openapis.org](https://github.com/OAI/learn.openapis.org) `examples/v2.0` (checked at its commit `5f26927b00d5d3d10c1a1a6bbe2d9b41b4a726e7`: every one of the 24 git blobs is identical to the one at `e77481c`), but that repository is licensed CC-BY-4.0, which asks for attribution, a link to the licence and a note of changes. The Apache-2.0 repository at the last commit before the folder was removed has the same bytes under the same licence as every other source here, so it is the pin; no CC-BY notice is needed. The JSON variants were not vendored. The `info.license` members inside the documents (MIT, Apache 2.0) describe the Petstore API they model, not these files.

One caveat for 3.1 and 3.2: OAI's source schemas carry `WORK-IN-PROGRESS` in their ids, and the 3.1 and 3.2 `pass/json_schema_dialect.yaml` document names that dialect, while the published schemas pinned above name the dated one. That document therefore fails the schema check as pinned, and validates once the URI is replaced.

To move the pin of one branch: set the new full SHA in the `url` of its entries (every entry of that version and kind carries the same one), add the entries of new files and drop those of deleted files, then run `--update` and review the diff. Entries for a folder at a commit are generated with:

```bash
SHA=6d86f6560681d0c461cd06b3faa80814aa120fda VERSION=3.2 DIR=tests/schema KIND=pass   # KIND: pass | fail
gh api "repos/OAI/OpenAPI-Specification/git/trees/${SHA}?recursive=1" --jq '.tree[].path' \
  | grep -E "^${DIR}/${KIND}/[^/]+\.yaml$" | sort | node -e '
const [sha, version, kind] = process.argv.slice(1);
const files = require("fs").readFileSync(0, "utf8").split("\n").filter(Boolean);
console.log(JSON.stringify(files.map((file) => {
  const name = file.split("/").pop();
  return {
    id: `oas-${version}-doc-${kind}-${name.replace(/\.yaml$/, "")}`,
    version,
    kind: `document-${kind}`,
    url: `https://raw.githubusercontent.com/OAI/OpenAPI-Specification/${sha}/${file}`,
    path: `documents/${version}/${kind}/${name}`,
  };
}), null, 2));
' "$SHA" "$VERSION" "$KIND"
```

(`DIR` is `_archive_/schemas/v3.0` for 3.0. The 2.0 documents are not in a `pass` folder upstream: list `examples/v2.0/yaml` at the pin with `gh api "repos/OAI/OpenAPI-Specification/git/trees/e77481c73e1c703c7de2e4249047b42b8e9b56f4?recursive=1" --jq '.tree[].path' | grep -E '^examples/v2\.0/yaml/.+\.yaml$' | sort`; each file `examples/v2.0/yaml/<path>` goes to `documents/2.0/pass/<path>`, with an id `oas-2.0-doc-pass-<path without .yaml, `/` as `-`, lower case>`, for example `oas-2.0-doc-pass-petstore-separate-spec-swagger`.) Paste the printed entries into `oas/sources.json` (without `sha256`, which `--update` fills in), then run `node scripts/sync-oas-sources.mjs --update`. Update the counts in the table above too.

## Regenerating and verifying

[`scripts/sync-oas-sources.mjs`](../../scripts/sync-oas-sources.mjs) downloads the pinned URLs, writes the exact response bytes, and rewrites the `sha256` values in the manifest:

```bash
node scripts/sync-oas-sources.mjs --update   # re-download every source, rewrite checksums
node scripts/sync-oas-sources.mjs            # offline: every file exists and matches its sha256, no unlisted files, the upstream table matches the entries
node scripts/sync-oas-sources.mjs --latest   # read-only, needs the network: what is NEWER upstream than what is pinned (exit 3 when something is)
```

To pin a newer iteration, change the entry's `url` (and its `path` only if the layout changes) in `oas/sources.json`, run `--update`, and review the diff. A redirect, a non-200 response, a body over 5 MB, or a host outside the script's allowlist (`spec.openapis.org`, `json-schema.org`, `raw.githubusercontent.com`) fails the update and writes nothing. `--update` downloads sequentially, one request per entry, and takes about 40 seconds for the full manifest. Files are written through a temp file and a rename, and a symlink at a destination is refused; OS metadata such as `.DS_Store` is ignored by the unlisted-file check.


# Maintaining OpenAPI Support

[Home](../README.md) | [Releasing](./releasing.md) | [Contributing](../CONTRIBUTING.md)

---

A runbook for maintainers: which official OpenAPI sources this repository pins, how to check them, and what to do when the OpenAPI Initiative (OAI) publishes something new.

Everything below names a file or a command that exists in the tree. Commands use `corepack yarn` (the repository pins Yarn 4; a global Yarn 1 is not the right one).

## The pinned sources

The official sources are vendored under `e2e/fixtures/oas/` and pinned in `e2e/fixtures/oas/sources.json` (provenance and licences: [`e2e/fixtures/README.md`](../e2e/fixtures/README.md)):

- `sources`: a flat list of `{ id, version, kind, url, path, sha256 }`. The schemas come from `https://spec.openapis.org/oas/<version>/<kind>/<YYYY-MM-DD>` (kinds `schema`, `schema-base`, `dialect`, `meta`; 2.0 and 3.0 have only `schema`); the JSON Schema meta-schemas from `json-schema.org`; the OAI test documents from `raw.githubusercontent.com` at a full commit SHA.
- `upstream`: where the test documents came from. One row per commit: `{ commit, version, ref, folders, note? }`. `ref` is the OAI branch the commit was taken from (`v3.2-dev`, `v3.1-dev`, `main` for the 3.0 archive); a row without `ref` is frozen (the 2.0 examples folder was removed from the repository, so the pin is its parent and there is nothing to follow). `folders` are the folders taken from the commit. `acknowledgedBranches` lists development branches already known and deliberately not pinned (see below). The sync script checks the table against the entries: every source on `raw.githubusercontent.com` must be explained by a row (same commit and version, under one of its folders) and every row must explain one, so moving a pin without the table fails verification.

`scripts/sync-oas-sources.mjs` is the one tool for it:

```bash
corepack yarn verify:sources                 # = node scripts/sync-oas-sources.mjs: offline, every file exists and matches its sha256; no unlisted file; the upstream table matches the entries (a CI step)
node scripts/sync-oas-sources.mjs --update   # download every url, write the bytes, rewrite the sha256 values (about 40 seconds)
node scripts/sync-oas-sources.mjs --latest   # read-only, needs network: what is NEWER upstream than what is pinned
node scripts/sync-oas-sources.mjs --latest --json
node scripts/sync-oas-sources.mjs --latest --manifest <file>   # the same against another manifest (a doctored copy, to see a finding)
```

Downloads are limited to `spec.openapis.org`, `json-schema.org` and `raw.githubusercontent.com`, never follow a redirect and stop at 5 MiB; `--latest` also asks `api.github.com`, with the same rules. `GITHUB_TOKEN`, when set, is sent to `api.github.com` only (no scope is needed, the repository is public). Without it the API allows 60 requests an hour per address; a `--latest` run in which no followed branch has moved makes five (three branch heads, one page of tags, one page of branches; each further hundred tags or branches is one more request), and two more for each pinned folder of a branch that has moved.

`--latest` exits **0** when nothing is newer, **3** when something is, and **1** on any error (an unreachable host, a rate limited API, a changed index page, an invalid manifest), so automation can tell "nothing to do" from "could not check". JSON Schema meta-schemas are frozen and are not checked. It reports:

| Finding (`type` in the JSON) | Meaning | Source |
| --- | --- | --- |
| `schema-iteration` | A later dated iteration of a pinned `schema`, `schema-base`, `dialect` or `meta` for the same version | the index https://spec.openapis.org/oas/ |
| `unpinned-version` | A version directory (or a specification text such as `v3.3.0.html`) on the index that no source is pinned for | the index |
| `documents-changed` | The head of the pinned branch moved **and** a pinned folder differs between the pinned commit and the head (compared by git tree, so a moved head with identical folders is not reported). Lists the added, removed and modified files and a compare link | `api.github.com`, `git/ref` and `git/trees` |
| `branch-gone` | A branch an `upstream.documents` row follows (`ref`) no longer exists (deleted or renamed). The pin cannot be followed: name its successor in `ref`, or drop `ref` to freeze the pin. A missing branch is a finding, not an error; a repository that cannot be read at all is still an error (exit 1) | `git/ref`, then the repository itself |
| `release-tag` | A release tag of `OAI/OpenAPI-Specification` (`3.3.0`, `3.3.0-rc0`) whose `major.minor` is newer than the newest pinned version | `tags` (paginated, 100 per page) |
| `dev-branch` | A `v<major>.<minor>-dev` branch of a version with no pinned sources and not in `acknowledgedBranches` | `branches` (paginated, 100 per page) |

If the index no longer lists an iteration that is pinned, the script fails (exit 1) instead of reporting "nothing newer": the page layout probably changed and the answer would mean nothing.

The report is bounded, because the weekly workflow carries it in an environment variable: at most 50 findings of a type, at most 48 KiB of compact JSON in all, and 20 names in any list. What does not fit is counted in `omitted` (per type) and shown as `and N more ... findings`, never dropped silently.

## When OAI publishes a new schema iteration

A `schema-iteration` finding names the manifest entry (`id`), the pinned date, the newest date and the URL. To move the pin:

1. In `e2e/fixtures/oas/sources.json` change the date in the entry's `url` (keep its `path` unless the layout changed). `schema` and `schema-base` usually move together; `dialect` and `meta` rarely, and their dates differ from the schema's.
2. `node scripts/sync-oas-sources.mjs --update` and read the diff of the vendored file (`git diff e2e/fixtures/oas/`): that diff is the change in the specification you are about to absorb.
3. `corepack yarn verify:sources`, `corepack yarn typecheck`, `corepack yarn test:coverage`.
4. Update the date and "retrieved" columns in the tables of `e2e/fixtures/README.md`.

A `documents-changed` finding is the same for the test documents: set the new full commit in the `url` of every entry of that version and kind **and** in the row of `upstream.documents` (the verification fails until both agree), add the entries of new files and drop those of deleted ones (the snippet in [`e2e/fixtures/README.md`](../e2e/fixtures/README.md#openapi-initiative-test-documents) lists a folder at a commit), run `--update`, and update the counts in `e2e/fixtures/README.md`.

## When OAI publishes a new OpenAPI version (for example 3.3)

A `release-tag`, `unpinned-version` or `dev-branch` finding for a minor version nobody supports yet is the trigger.

1. In `e2e/fixtures/oas/sources.json` add the four schema entries (`oas-3.3-schema`, `oas-3.3-schema-base`, `oas-3.3-dialect`, `oas-3.3-meta`: `version: "3.3"`, `url: https://spec.openapis.org/oas/3.3/<kind>/<date>` with the dates from the index, `path: schemas/3.3/<kind>.json`). The dialect and meta dates differ from the schema's.
2. Add the test documents: generate the entries for `tests/schema/pass` and `tests/schema/fail` at a full commit of `v3.3-dev` with the snippet in `e2e/fixtures/README.md` (`documents/3.3/{pass,fail}/<name>.yaml`, ids `oas-3.3-doc-<pass|fail>-<name>`), and add the row to `upstream.documents`: `{ "commit": "<sha>", "version": "3.3", "ref": "v3.3-dev", "folders": ["tests/schema/pass", "tests/schema/fail"] }`. If the version has been published, pin the release's commit rather than the branch head.
3. `node scripts/sync-oas-sources.mjs --update`, then `git diff e2e/fixtures/oas/` and read it: the new files and checksums are the only change. Run `corepack yarn verify:sources` afterwards.
4. Record the pins in the tables of `e2e/fixtures/README.md` and check `e2e/fixtures/NOTICES.md` (the OAI sources are Apache-2.0 and vendored unmodified, so no licence text is reproduced).

A `dev-branch` finding is an early notice; once you have decided it needs no action yet, add its name to `upstream.acknowledgedBranches` in the manifest so the weekly run stops reporting it (it is still found through the index and the tags when the version is published).

## The spec-watch workflow

[`.github/workflows/spec-watch.yml`](../.github/workflows/spec-watch.yml) runs `node scripts/sync-oas-sources.mjs --latest --json` every Wednesday (06:23 UTC) and on demand (`workflow_dispatch`). It opens, or updates, **one** issue titled `OpenAPI sources: newer versions available` listing the findings and pointing here.

- **Two jobs.** `check` has `contents: read` only and reads the network; it hands the report to `report` as one JSON value in an environment variable (the script keeps it under 48 KiB; the job refuses one over 100,000 bytes). `report` has `issues: write` only and checks nothing out. Both run only in `agentfront/openapi-spec`, never in a fork. No secret is used: the token is the workflow's own, and its only use in `check` is lifting the unauthenticated GitHub API limit.
- **No injection.** Nothing fetched is interpolated into a shell command or a workflow expression inside a `run:` block. The report travels in an environment variable, the script has already restricted every upstream name to a plain character set (branch names, tags and dates must match fixed patterns, file names are escaped), and the issue text is built from the JSON by `jq`, with each value in a code span.
- **No duplicates, and no adopted strangers.** The workflow's own issue is the open issue that has exactly that title, was written by `github-actions[bot]` and carries the `spec-watch` label. `report` creates the label once if it is missing, reads every page of the open issues with that label, takes the lowest-numbered match and edits its text only when it differs; with none it creates the issue with the label. `concurrency: spec-watch` stops two runs from racing. Close the issue when the pins are moved; a new one opens only if something is still newer.
- **A failed check is not "nothing newer".** An unreachable host, a rate limited API or a changed index page fails the `check` job (exit 1 of the script), which GitHub reports as a failed run.
- **Fail closed.** Every step runs with `set -euo pipefail`. The `check` job refuses output that is not a report agreeing with the script's exit code, and `report` refuses an empty or malformed report, an empty issue text, and an empty body at the moment it would create or edit an issue. The issue text is cut at a line end below GitHub's limit when it is too long, and says so.
- **Dry run.** *Actions, Spec watch, Run workflow* with `dry_run` set prints the issue text in the job summary and touches no issue. The `check` job always prints the full JSON report in its summary, so a run that finds nothing still shows what was checked.

To reproduce what the workflow sees: `GITHUB_TOKEN="$(gh auth token)" node scripts/sync-oas-sources.mjs --latest`.

# Contributing to openapi-spec

Thanks for your interest in contributing! This document covers everything you
need to get a change from idea to merged PR.

## Getting started

**Requirements**: Node.js >= 22.19, Yarn 4 (via corepack).

```bash
git clone https://github.com/agentfront/openapi-spec.git
cd openapi-spec
corepack enable
yarn install
yarn test
```

Useful commands:

| Command              | Purpose                               |
| -------------------- | ------------------------------------- |
| `yarn test`          | Run the tests                         |
| `yarn test:coverage` | Tests with the enforced coverage gate |
| `yarn typecheck`     | Type-check `src` (no Node types), the unit tests, the e2e stories and the type tests |
| `yarn test:e2e`      | E2E stories: the types against the official OpenAPI JSON Schemas, field by field |
| `yarn build`         | Build CJS + ESM + type declarations   |
| `yarn verify:sources` | Check the pinned official OpenAPI sources against their checksums (offline) |

Maintainers: [Maintaining OpenAPI Support](./docs/maintaining-openapi-support.md) (the pinned
sources and the weekly spec watch) and [Releasing](./docs/releasing.md).

## Pull requests

- Every change comes with tests; coverage stays at 100%.
- A change to how a document is read names the OpenAPI version and the section
  of the specification it follows.
- Security issues go through [SECURITY.md](./SECURITY.md), never a public issue.

By contributing you agree that your contributions are licensed under the
[Apache-2.0 License](./LICENSE) and that you follow the
[Code of Conduct](./CODE_OF_CONDUCT.md).

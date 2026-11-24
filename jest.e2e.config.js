/**
 * E2E story suite: the vendored official sources and the real TypeScript
 * compiler. No coverage: the 100% gate is a unit-suite contract owned by
 * jest.config.js. Run with `yarn test:e2e`.
 */
const base = require('./jest.config.js');

module.exports = {
  displayName: 'openapi-spec-e2e',
  testEnvironment: 'node',
  roots: ['<rootDir>/e2e'],
  testMatch: ['**/*.e2e.ts'],
  // Stories import the real package name so they read exactly like consumer
  // code; the runner maps it onto the source entrypoint.
  moduleNameMapper: { '^openapi-spec$': '<rootDir>/src/index.ts' },
  transform: base.transform,
  moduleFileExtensions: base.moduleFileExtensions,
  testTimeout: 30_000,
  maxWorkers: '50%',
};

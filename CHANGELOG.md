## [1.0.0] - 2026-11-24

### Added
- Types for Swagger 2.0 and OpenAPI 3.0, 3.1 and 3.2 (`OAS20`, `OAS30`, `OAS31`, `OAS32`), the cross-version unions (`OpenAPIDocument`, `OperationObject`, ...) and `WithExtensions`.
- Version detection and profiles: `detectSpecVersion`, `isSwagger2`, `SPEC_PROFILES`, `SPEC_FEATURES`, `resolveOperationLayout`.
- The operations of a Path Item as the declared version defines them: `listOperations`, `getOperation`, `STANDARD_METHODS`, `HTTPMethod`.
- Swagger 2.0 to OpenAPI 3.0.3 conversion: `upgradeSwagger2`.
- `isReferenceObject`, `wrapReferenceSiblings`, `readParameterName`, and the diagnostics helpers (`SPEC_DIAGNOSTIC_CODES`, `jsonPointer`, `describeValue`).

### Security
- The Swagger 2.0 converter groups its findings in one linear pass (CodeQL `js/polynomial-redos`).

## [0.0.1] - 2026-11-24

Reserves the package name. Exports nothing yet.

/**
 * openapi-spec: types for OpenAPI 3.2, 3.1, 3.0 and Swagger 2.0, version
 * detection and profiles, the operations of a Path Item, and the Swagger 2.0
 * to OpenAPI 3.0 converter.
 *
 * It uses no Node.js API: `tsconfig.json` compiles it with `types: []`.
 *
 * @module
 */

export type * from './types';

export {
  SPEC_DIAGNOSTIC_CODES,
  DESCRIBED_VALUE_MAX_LENGTH,
  DIAGNOSTIC_KEY_MAX_LENGTH,
  MAX_POINTER_SEGMENT_LENGTH,
  POINTER_TRUNCATION_MARKER,
  UNSAFE_CHARACTER_CLASS,
  appendPointer,
  describeValue,
  diagnosticKey,
  escapePointerSegment,
  jsonPointer,
} from './diagnostics';
export type { SpecDiagnostic, SpecDiagnosticCode, SpecDiagnosticSeverity } from './diagnostics';

export {
  FULL_OPERATION_LAYOUT,
  LEGACY_OPERATION_LAYOUT,
  REFUSED_METHODS,
  STANDARD_METHODS,
  getOperation,
  isHttpToken,
  isReferenceObject,
  isRefusedMethod,
  isSpecObject,
  isStandardMethod,
  listOperations,
  ownProperty,
  setOwnProperty,
  toStandardMethod,
  wireMethod,
} from './operations';
export type {
  GetOperationOptions,
  HTTPMethod,
  ListOperationsOptions,
  OperationEntry,
  OperationLayout,
  OperationList,
  OperationSource,
  StandardMethod,
} from './operations';

export {
  LATEST_SPEC_FAMILY,
  SPEC_FAMILIES,
  SPEC_FEATURES,
  SPEC_PROFILES,
  SUPPORTED_SPEC_VERSIONS,
  compareSpecFamilies,
  describeSpecVersionProblem,
  detectSpecVersion,
  featureNewerThanDeclared,
  getSpecProfile,
  isFeatureAvailable,
  isSwagger2,
  listSkippedNewerOperations,
  resolveOperationLayout,
  securitySchemeProblem,
} from './versions';
export type {
  ListSkippedNewerOperationsOptions,
  ParameterLocationName,
  SkippedOperationField,
  SpecFamily,
  SpecFeature,
  SpecFeatureId,
  SpecProfile,
  SpecVersionField,
  SpecVersionInfo,
  SpecVersionStatus,
} from './versions';

export {
  MAX_CONVERSION_ENTRIES,
  MAX_MEDIA_TYPES_PER_LIST,
  UPGRADED_OPENAPI_VERSION,
  isDotSegment,
  readSwagger2BasePath,
  swagger2SkippedOperations,
  upgradeSwagger2,
} from './upgrade-v2';
export type { Swagger2BasePath, UpgradeSwagger2Options, UpgradeSwagger2Result } from './upgrade-v2';

export { parameterNameNotStringDiagnostic, pathTemplateNames, readParameterName, withTextName } from './parameters';
export { wrapReferenceSiblings } from './schema-references';
export type { ParameterName } from './parameters';

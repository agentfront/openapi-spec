/**
 * How consumers read HTTP methods, declared OpenAPI versions and diagnostics:
 * the nine standard methods, the operations of a Path Item (any
 * `additionalOperations` token included), the declared version and its family
 * (Swagger 2.0 among them), and what a diagnostic says. All of it must keep
 * compiling; the matching rejections are in `rejections.types.ts` and the
 * type-level facts in `shapes.types.ts`. Compiled by `yarn typecheck`, never
 * executed (see README.md).
 */
import {
  SPEC_DIAGNOSTIC_CODES,
  SUPPORTED_SPEC_VERSIONS,
  detectSpecVersion,
  getOperation,
  isStandardMethod,
  listOperations,
  resolveOperationLayout,
} from 'openapi-spec';
import type {
  OpenAPIDocument,
  OperationLayout,
  OperationList,
  SpecDiagnostic,
  SpecDiagnosticCode,
  SpecFamily,
  SpecVersionField,
  SpecVersionInfo,
  SpecVersionStatus,
  StandardMethod,
} from 'openapi-spec';

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

declare const openApiDocument: OpenAPIDocument;

// ---------------------------------------------------------------------------
// isStandardMethod is a boolean, not a type guard: it ignores case (`GET` is
// standard), so it cannot say the value is the lowercase literal. The lookup
// that narrows is getOperation: a `fixed` entry's method is a StandardMethod.
// ---------------------------------------------------------------------------

/** A method and a path as read from a document at runtime: plain strings. */
export function countStandardOperations(found: ReadonlyArray<{ method: string; path: string }>): Record<StandardMethod, number> {
  const counts: Record<StandardMethod, number> = {
    get: 0,
    post: 0,
    put: 0,
    patch: 0,
    delete: 0,
    head: 0,
    options: 0,
    trace: 0,
    query: 0,
  };
  for (const { method, path } of found) {
    // usable as a plain condition
    if (!isStandardMethod(method)) continue;
    const entry = getOperation(openApiDocument.paths?.[path], method);
    if (entry?.source === 'fixed') {
      type Narrowed = [Expect<Equal<typeof entry.method, StandardMethod>>];
      counts[entry.method] += 1;
    } else if (entry?.source === 'additional') {
      type Open = [Expect<Equal<typeof entry.method, string>>];
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// The operations a document has: the layout the declared version defines
// (`query` and `additionalOperations` from 3.2), passed to the walk
// ---------------------------------------------------------------------------

export function enumerateOperations(): string[] {
  const layout: OperationLayout = resolveOperationLayout(detectSpecVersion(openApiDocument));
  const found: string[] = [];
  for (const [path, pathItem] of Object.entries(openApiDocument.paths ?? {})) {
    const list: OperationList = listOperations(pathItem, { layout });
    for (const entry of list.operations) found.push(`${entry.method} ${path} ${entry.source}`);
    // an `additionalOperations` method is matched exactly as written
    const link = getOperation(pathItem, 'LINK', { layout });
    if (link !== undefined) found.push(`${link.method} ${path} ${link.source}`);
  }
  return found;
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

export function readDiagnostics(diagnostics: SpecDiagnostic[]): string[] {
  return diagnostics.map((diagnostic) => {
    const severity: 'warning' | 'info' = diagnostic.severity;
    const code: string = diagnostic.code;
    const message: string = diagnostic.message;
    const path: string | undefined = diagnostic.path;
    // codes are compared with the registry's values
    const ignoredMethod =
      code === SPEC_DIAGNOSTIC_CODES.REFUSED_METHOD || code === SPEC_DIAGNOSTIC_CODES.INVALID_METHOD_TOKEN;
    return `${severity} ${code} ${path ?? ''} ${ignoredMethod} ${message}`;
  });
}

/** A diagnostic code is a string: it can be compared with, and used where, a string is. */
export const specCode: SpecDiagnosticCode = SPEC_DIAGNOSTIC_CODES.NEWER_OPENAPI_VERSION;
export const knownCodeAsString: string = specCode;

// ---------------------------------------------------------------------------
// The declared version
// ---------------------------------------------------------------------------

export function readSpecVersion(): string {
  const info: SpecVersionInfo = detectSpecVersion(openApiDocument);
  const status: SpecVersionStatus = info.status;
  const family: SpecFamily | undefined = info.family;
  const major: number | undefined = info.major;
  const minor: number | undefined = info.minor;
  const declared: unknown = info.declared;
  const diagnostics: SpecDiagnostic[] = info.diagnostics;
  const version = `${major ?? ''}.${minor ?? ''}`;
  return `${status} ${family ?? 'unprocessable'} ${version} ${String(declared)} ${diagnostics.length}`;
}

// ---------------------------------------------------------------------------
// Swagger 2.0: a supported family of its own, declared by `swagger`
// ---------------------------------------------------------------------------

/**
 * A Swagger 2.0 document is `supported` like any other: family `2.0`, read from the `swagger` member (a string, or the
 * number an unquoted `2.0` is in YAML), where the others are read from `openapi`. It no longer has a status of its own.
 */
export const swaggerInfo: SpecVersionInfo = detectSpecVersion({ swagger: '2.0', info: { title: 'Pets' }, paths: {} });
export const yamlSwaggerInfo: SpecVersionInfo = detectSpecVersion({ swagger: 2, paths: {} });

export function isSwagger(info: SpecVersionInfo): boolean {
  const family: SpecFamily | undefined = info.family;
  const field: SpecVersionField | undefined = info.field;
  return info.status === 'supported' && family === '2.0' && field === 'swagger';
}

/** The five statuses: a switch over them with no `default` is exhaustive, and `swagger-2.0` is not one. */
export function describeStatus(info: SpecVersionInfo): string {
  const status: SpecVersionStatus = info.status;
  switch (status) {
    case 'supported':
      return `${info.field ?? 'openapi'} ${info.family ?? ''}`;
    case 'newer-minor':
      return 'processed with the latest profile';
    case 'unsupported':
    case 'malformed':
    case 'missing':
      return `not processed: ${status}`;
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

/** The families, oldest first; the supported versions are named for messages, `2.0` and then `3.0.x` ... */
export const knownFamilies: SpecFamily[] = ['2.0', '3.0', '3.1', '3.2'];
export const supportedVersions: readonly string[] = SUPPORTED_SPEC_VERSIONS;

/** A 2.0 document reads its operations with the layout of its version, like any other. */
export const swaggerLayout: OperationLayout = resolveOperationLayout(swaggerInfo);

/**
 * Official-documents story: the OpenAPI Initiative's own test documents (the
 * OpenAPI 3.0 archive, 3.1 and 3.2 `tests/schema`, and the Swagger 2.0
 * examples, vendored under e2e/fixtures/oas/documents and pinned by sha256 in
 * e2e/fixtures/oas/sources.json) read by this package.
 *
 * Each PASS document, which OAI's own suite validates against its schema, is
 * checked at separate layers, so a failure names the layer:
 *
 * 1. `schema`: it validates against the official JSON Schema for its version
 *    (e2e/helpers/oas-validate.ts, offline);
 * 2. `types`: it type-checks against our types (`OAS20.SwaggerObject`,
 *    `OAS30`/`OAS31`/`OAS32` `.OpenAPIObject`) as an annotated object literal,
 *    with the real TypeScript compiler. `x-` keys are removed first, because the
 *    types declare no index signatures on purpose (read extensions through
 *    `WithExtensions`). All documents of a version are compiled as one file;
 * 3. `version`: `detectSpecVersion` reads it as a supported document of its
 *    version, with no diagnostic;
 * 4. `operations`: `listOperations`, with the layout `resolveOperationLayout`
 *    gives that version, finds exactly the operations pinned for it under
 *    `paths` (e2e/expected/official-operations.json), in order, and ignores
 *    nothing. Webhooks and component path items are not operations of `paths`;
 * 5. `conversion` (Swagger 2.0): `upgradeSwagger2` converts it into a document
 *    that validates against the official OpenAPI 3.0 schema, keeps no field only
 *    Swagger 2.0 has, and leaves its input unchanged. The multi-file
 *    `petstore-separate` is not converted here: the converter takes a
 *    dereferenced document, and this package has no dereferencer.
 *
 * Each FAIL document, which OAI's suite requires the schema to reject, must be
 * rejected by the official schema here too (the helper's sanity check), and is
 * read by every function of the package without a throw (`crash`): they are
 * total, a document of any shape gives findings, never an exception.
 *
 * What does not hold yet is in `KNOWN_GAPS`, and each entry is asserted to
 * still fail exactly as listed: fixing a gap fails the story until its entry
 * is deleted, so the table only shrinks.
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import * as yaml from 'yaml';
import {
  STANDARD_METHODS,
  detectSpecVersion,
  getOperation,
  jsonPointer,
  listOperations,
  listSkippedNewerOperations,
  resolveOperationLayout,
  upgradeSwagger2,
  wrapReferenceSiblings,
} from 'openapi-spec';
import { fixturePath, loadFixture } from './helpers/fixtures';
import { validateOasDocument, type SchemaVersion } from './helpers/oas-validate';
import { compileVirtual } from './helpers/tsc';

type Check = 'schema' | 'types' | 'version' | 'operations' | 'conversion' | 'crash';

/** One failure a gap covers: a reported line in full, or a pattern with the exact number of lines it matches. */
type Failure = string | { pattern: RegExp; count: number };

interface KnownGap {
  version: SchemaVersion;
  /** `crash` entries list FAIL documents; every other check lists PASS documents. */
  check: Check;
  /** Short kebab-case cause shared by the documents of one entry. */
  category: string;
  /** Why the check fails today. */
  reason: string;
  /** Every failure line this entry covers, for each of its documents. */
  failures: Failure[];
  /** Document names, without `.yaml`. */
  documents: string[];
}

/**
 * Documents the package does not handle yet. Fixing a gap and deleting its
 * entry is a pure deletion; nothing else in this file refers to the entries.
 */
const KNOWN_GAPS: KnownGap[] = [
  // --- OpenAPI 3.1 -------------------------------------------------------
  {
    version: '3.1',
    check: 'schema',
    category: 'wip-dialect-uri',
    reason:
      "The document names the work-in-progress dialect (`.../dialect/WORK-IN-PROGRESS`), as OAI's source schemas do; the published schema pins the dated dialect with `const`. Proven below: with the pinned URI the document validates.",
    failures: [
      '/components/schemas/WithDollarSchema/$schema: must be equal to constant (https://spec.openapis.org/oas/3.1/dialect/2024-11-10)',
      '/jsonSchemaDialect: must be equal to constant (https://spec.openapis.org/oas/3.1/dialect/2024-11-10)',
    ],
    documents: ['json_schema_dialect'],
  },
  {
    version: '3.1',
    check: 'types',
    category: 'schema-unknown-keyword',
    reason:
      'JSON Schema allows keywords an OpenAPI dialect does not define (`myArbitraryKeyword: true`); OAS31.SchemaObject is a closed object type without an index signature.',
    failures: [
      '`"myArbitraryKeyword": true`: Object literal may only specify known properties, and \'"myArbitraryKeyword"\' does not exist in type \'SchemaObject\'.',
    ],
    documents: ['mega'],
  },
  // --- OpenAPI 3.2 -------------------------------------------------------
  {
    version: '3.2',
    check: 'schema',
    category: 'wip-dialect-uri',
    reason:
      'As for 3.1: the document names `.../oas/3.2/dialect/WORK-IN-PROGRESS`, the published schema pins the dated dialect.',
    failures: [
      '/components/schemas/WithDollarSchema/$schema: must be equal to constant (https://spec.openapis.org/oas/3.2/dialect/2026-02-26)',
      '/jsonSchemaDialect: must be equal to constant (https://spec.openapis.org/oas/3.2/dialect/2026-02-26)',
    ],
    documents: ['json_schema_dialect'],
  },
  {
    version: '3.2',
    check: 'types',
    category: 'schema-unknown-keyword',
    reason: 'As for 3.1: `myArbitraryKeyword: true` in a Schema Object; OAS32.SchemaObject is closed.',
    failures: [
      '`"myArbitraryKeyword": true`: Object literal may only specify known properties, and \'"myArbitraryKeyword"\' does not exist in type \'SchemaObject\'.',
    ],
    documents: ['mega'],
  },
];

type Namespace = 'OAS20' | 'OAS30' | 'OAS31' | 'OAS32';

/** The type of the document root in each namespace: Swagger 2.0 calls it the Swagger Object. */
const ROOT_TYPES: Record<Namespace, string> = {
  OAS20: 'SwaggerObject',
  OAS30: 'OpenAPIObject',
  OAS31: 'OpenAPIObject',
  OAS32: 'OpenAPIObject',
};

const VERSIONS: Array<{ version: SchemaVersion; namespace: Namespace; pass: number; fail: number }> = [
  // Seven files and one multi-file tree (`petstore-separate`, see TREES); the OAI repository has no 2.0 FAIL document
  { version: '2.0', namespace: 'OAS20', pass: 8, fail: 0 },
  { version: '3.0', namespace: 'OAS30', pass: 6, fail: 0 },
  { version: '3.1', namespace: 'OAS31', pass: 35, fail: 12 },
  { version: '3.2', namespace: 'OAS32', pass: 37, fail: 31 },
];

/** The operations each PASS document declares under `paths` (`<method> <path>`); a document with none has no entry. */
const OPERATIONS = JSON.parse(readFileSync(join(__dirname, 'expected', 'official-operations.json'), 'utf8')) as Record<
  SchemaVersion,
  Record<string, string[]>
>;

/** The root fields only Swagger 2.0 has: a converted document keeps none of them. */
const SWAGGER_2_ONLY_FIELDS = [
  'swagger',
  'host',
  'basePath',
  'schemes',
  'consumes',
  'produces',
  'definitions',
  'parameters',
  'responses',
  'securityDefinitions',
];

// ---------------------------------------------------------------------------
// Known gaps
// ---------------------------------------------------------------------------

const gapKey = (version: SchemaVersion, check: Check, document: string): string =>
  `${version}/${check === 'crash' ? 'fail' : 'pass'}/${document} [${check}]`;

const gapsFor = (version: SchemaVersion, check: Check, document: string): KnownGap[] =>
  KNOWN_GAPS.filter((gap) => gap.version === version && gap.check === check && gap.documents.includes(document));

const describeFailure = (failure: Failure): string =>
  typeof failure === 'string' ? JSON.stringify(failure) : `${failure.count} line(s) matching ${failure.pattern}`;

/**
 * Asserts one check's outcome. `problems` is the lines the check reports, empty
 * when it holds. The entries listed for the document must account for every
 * line exactly: a line they list in full is one line; a pattern consumes
 * exactly its `count` of the lines matching it. A line no entry accounts for
 * fails the check; a failure an entry lists that did not occur as listed is
 * reported so the entry can be deleted or corrected.
 */
function expectCheck(version: SchemaVersion, document: string, check: Check, problems: string[]): void {
  const entries = gapsFor(version, check, document);
  const remaining = [...problems];
  const stale: string[] = [];
  const consume = (gap: KnownGap, failure: Failure): void => {
    if (typeof failure === 'string') {
      const index = remaining.indexOf(failure);
      if (index < 0) stale.push(`the ${gap.category} entry lists ${describeFailure(failure)}, which no longer occurs`);
      else remaining.splice(index, 1);
      return;
    }
    const matching = remaining.filter((line) => failure.pattern.test(line));
    for (const line of matching) remaining.splice(remaining.indexOf(line), 1);
    if (matching.length !== failure.count) {
      stale.push(`the ${gap.category} entry lists ${describeFailure(failure)}, found ${matching.length}`);
    }
  };
  for (const gap of entries) for (const failure of gap.failures) consume(gap, failure);

  // A failure no entry lists: an unlisted failure fails normally
  expect(remaining).toEqual([]);
  if (stale.length > 0) {
    throw new Error(
      `${gapKey(version, check, document)} no longer fails exactly as KNOWN_GAPS records: ${stale.join('; ')}. ` +
        `Delete "${document}" or the failure from the entry (or correct it).`,
    );
  }
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

type Kind = 'pass' | 'fail';
type Doc = Record<string, unknown>;

/**
 * A document that is a tree of files, not one file: its name is the folder under `<version>/pass` and its entry the
 * root file inside it. The checks read the root file with its references to the other files unresolved.
 */
const TREES: Record<string, string> = { '2.0/pass/petstore-separate': 'spec/swagger.yaml' };

const documentNames = (version: SchemaVersion, kind: Kind): string[] => {
  try {
    const trees = Object.keys(TREES)
      .filter((key) => key.startsWith(`${version}/${kind}/`))
      .map((key) => key.slice(`${version}/${kind}/`.length));
    return [
      ...readdirSync(fixturePath(`oas/documents/${version}/${kind}`))
        .filter((file) => file.endsWith('.yaml'))
        .map((file) => file.slice(0, -'.yaml'.length)),
      ...trees,
    ].sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
};

const isTree = (version: SchemaVersion, kind: Kind, name: string): boolean =>
  TREES[`${version}/${kind}/${name}`] !== undefined;

const documentFile = (version: SchemaVersion, kind: Kind, name: string): string => {
  const entry = TREES[`${version}/${kind}/${name}`];
  return `oas/documents/${version}/${kind}/${entry === undefined ? `${name}.yaml` : `${name}/${entry}`}`;
};

/** A fresh parse each time: no check sees an object another one read. */
const loadDocument = (version: SchemaVersion, kind: Kind, name: string): Doc =>
  yaml.parse(loadFixture(documentFile(version, kind, name))) as Doc;

/** Removes every `x-` key at any depth. */
function stripExtensions(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripExtensions);
  if (node === null || typeof node !== 'object') return node;
  const out: Doc = {};
  for (const [key, value] of Object.entries(node)) if (!key.startsWith('x-')) out[key] = stripExtensions(value);
  return out;
}

// ---------------------------------------------------------------------------
// Layer 2: type-check
// ---------------------------------------------------------------------------

interface TypeCheck {
  /** Diagnostics per document name. */
  byDocument: Map<string, string[]>;
  /** Diagnostics that belong to no document (the import header). */
  unattributed: string[];
}

/** Compiles every PASS document of a version as `const d: <namespace>.<root type> = <literal>;` in one virtual file. */
function typeCheckDocuments(version: SchemaVersion, namespace: Namespace, names: string[]): TypeCheck {
  let source = `import type { ${namespace} } from '../src';\n`;
  const spans: Array<{ name: string; start: number; end: number }> = [];
  names.forEach((name, index) => {
    const literal = JSON.stringify(stripExtensions(loadDocument(version, 'pass', name)), null, 2);
    const start = source.length;
    source += `const doc${index}: ${namespace}.${ROOT_TYPES[namespace]} = ${literal};\n`;
    spans.push({ name, start, end: source.length });
  });

  const diagnostics = compileVirtual(`official-${version}.ts`, source, {
    baseDir: __dirname,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    },
  });

  const result: TypeCheck = { byDocument: new Map(names.map((name) => [name, []])), unattributed: [] };
  for (const diagnostic of diagnostics) {
    const parsed = /^.*?:(\d+) ([\s\S]*)$/.exec(diagnostic);
    const offset = parsed ? Number(parsed[1]) : -1;
    const message = (parsed ? parsed[2] : diagnostic).split('\n')[0];
    const span = spans.find(({ start, end }) => offset >= start && offset < end);
    if (!span) {
      result.unattributed.push(diagnostic);
      continue;
    }
    const lineStart = source.lastIndexOf('\n', offset) + 1;
    const line = source.slice(lineStart, source.indexOf('\n', offset)).trim();
    result.byDocument.get(span.name)!.push(`\`${line.slice(0, 80)}\`: ${message}`);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Layers 3 to 5: version, operations, conversion
// ---------------------------------------------------------------------------

const describeDiagnostic = ({ code, path, message }: { code: string; path?: string; message: string }): string =>
  `${code} at ${path ?? '/'}: ${message}`;

/** What `detectSpecVersion` reads that is not "a supported document of `version`, with no diagnostic". */
function versionProblems(version: SchemaVersion, document: Doc): string[] {
  const { status, family, diagnostics } = detectSpecVersion(document);
  return [
    ...(status === 'supported' && family === version ? [] : [`read as ${status} ${family ?? ''}`.trim()]),
    ...diagnostics.map(describeDiagnostic),
  ];
}

/** The operations of `paths`, paths sorted, each path item as `listOperations` lists it; and what it ignored. */
function listedOperations(document: Doc): { operations: string[]; ignored: string[] } {
  const layout = resolveOperationLayout(detectSpecVersion(document));
  const paths = (document['paths'] ?? {}) as Doc;
  const operations: string[] = [];
  const ignored: string[] = [];
  for (const path of Object.keys(paths).sort()) {
    const listed = listOperations(paths[path], { layout, pointer: jsonPointer('paths', path) });
    operations.push(...listed.operations.map(({ method }) => `${method} ${path}`));
    ignored.push(...listed.diagnostics.map(describeDiagnostic));
  }
  return { operations, ignored };
}

/** What makes a converted Swagger 2.0 document not a faithful OpenAPI 3.0 one. */
function conversionProblems(document: Doc): string[] {
  const before = JSON.stringify(document);
  const { document: converted, tooLarge } = upgradeSwagger2(document);
  return [
    ...(tooLarge ? ['the conversion was abandoned as too large'] : []),
    ...validateOasDocument('3.0', converted).errors.map((error) => `3.0 schema: ${error}`),
    ...SWAGGER_2_ONLY_FIELDS.filter((field) => Object.hasOwn(converted, field)).map((field) => `keeps \`${field}\``),
    ...(JSON.stringify(document) === before ? [] : ['the input was changed']),
  ];
}

/** Every function of the package over a document that throws instead of reporting: none should. */
function crashes(document: Doc): string[] {
  const found: string[] = [];
  const attempt = (stage: string, run: () => unknown): void => {
    try {
      run();
    } catch (error) {
      found.push(`${stage}: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`);
    }
  };
  const version = detectSpecVersion(document);
  const layout = resolveOperationLayout(version);
  const pathItems = [document['paths'], document['webhooks']].flatMap((map) =>
    map !== null && typeof map === 'object' ? Object.values(map) : [],
  );
  for (const pathItem of pathItems) {
    attempt('listOperations', () => listOperations(pathItem, { layout }));
    attempt('listSkippedNewerOperations', () => listSkippedNewerOperations(pathItem, layout));
    for (const method of STANDARD_METHODS) attempt(`getOperation ${method}`, () => getOperation(pathItem, method, { layout }));
  }
  attempt('wrapReferenceSiblings', () => wrapReferenceSiblings(structuredClone(document)));
  attempt('upgradeSwagger2', () => upgradeSwagger2(document));
  return found;
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

describe.each(VERSIONS)('story: official OpenAPI $version test documents', ({ version, namespace, pass, fail }) => {
  const passNames = documentNames(version, 'pass');
  const failNames = documentNames(version, 'fail');
  let typeCheck: TypeCheck;

  beforeAll(() => {
    typeCheck = typeCheckDocuments(version, namespace, passNames);
  });

  it('vendors the pinned set of documents', () => {
    expect({ pass: passNames.length, fail: failNames.length }).toEqual({ pass, fail });
  });

  it('pins operations for existing documents only, and lists known gaps for existing documents only', () => {
    expect(Object.keys(OPERATIONS[version] ?? {}).filter((name) => !passNames.includes(name))).toEqual([]);
    const unknown = KNOWN_GAPS.filter((gap) => gap.version === version).flatMap((gap) =>
      gap.documents.filter((name) => !(gap.check === 'crash' ? failNames : passNames).includes(name)),
    );
    expect(unknown).toEqual([]);
  });

  it('resolves the spec types the documents are checked against', () => {
    expect(typeCheck.unattributed).toEqual([]);
  });

  describe.each(passNames)('pass/%s', (name) => {
    const load = (): Doc => loadDocument(version, 'pass', name);

    it('validates against the official schema', () => {
      expectCheck(version, name, 'schema', validateOasDocument(version, load()).errors);
    });

    it('type-checks against our types', () => {
      expectCheck(version, name, 'types', typeCheck.byDocument.get(name)!);
    });

    it('is read as a supported document of its version', () => {
      expectCheck(version, name, 'version', versionProblems(version, load()));
    });

    it('lists exactly the pinned operations, and ignores nothing', () => {
      const { operations, ignored } = listedOperations(load());
      const expected = OPERATIONS[version]?.[name] ?? [];
      const problems = [
        ...(JSON.stringify(operations) === JSON.stringify(expected)
          ? []
          : [`lists ${JSON.stringify(operations)}, pinned ${JSON.stringify(expected)}`]),
        ...ignored,
      ];
      expectCheck(version, name, 'operations', problems);
    });

    if (version === '2.0' && !isTree(version, 'pass', name)) {
      it('converts to an OpenAPI 3.0 document the official 3.0 schema accepts', () => {
        expectCheck(version, name, 'conversion', conversionProblems(load()));
      });
    }
  });

  if (failNames.length > 0) {
    describe.each(failNames)('fail/%s', (name) => {
      const load = (): Doc => loadDocument(version, 'fail', name);

      it('is rejected by the official schema', () => {
        expect(validateOasDocument(version, load()).valid).toBe(false);
      });

      it('is read by every function of the package without a throw', () => {
        expectCheck(version, name, 'crash', crashes(load()));
      });
    });
  }
});

describe('story: official OpenAPI documents, the work-in-progress dialect', () => {
  // OAI's source schemas carry `WORK-IN-PROGRESS` in their ids and a document may name that dialect;
  // the published schemas pin the dated one. Replacing the URI is what publishing does.
  it.each(['3.1', '3.2'] as const)(
    'validates against the pinned %s schema once its dialect URI is the pinned one',
    (version) => {
      const dialect = (
        JSON.parse(loadFixture(`oas/schemas/${version}/schema-base.json`)) as {
          $defs: { dialect: { const: string } };
        }
      ).$defs.dialect.const;
      const text = loadFixture(`oas/documents/${version}/pass/json_schema_dialect.yaml`);
      expect(text).toContain(`${dialect.slice(0, dialect.lastIndexOf('/'))}/WORK-IN-PROGRESS`);
      const document = yaml.parse(
        text.split(`${dialect.slice(0, dialect.lastIndexOf('/'))}/WORK-IN-PROGRESS`).join(dialect),
      ) as Doc;
      expect(validateOasDocument(version, document)).toEqual({ valid: true, errors: [] });
    },
  );
});

describe('story: official OpenAPI documents, the oracle', () => {
  it('pins operations written as `<method> <path>`, with paths of the document', () => {
    const malformed = Object.entries(OPERATIONS)
      .filter(([version]) => version !== '$comment')
      .flatMap(([version, documents]) =>
        Object.entries(documents).flatMap(([name, operations]) =>
          operations.filter((operation) => !/^[A-Za-z]+ \/\S*$/.test(operation)).map((operation) => `${version}/${name}: ${operation}`),
        ),
      );
    expect(malformed).toEqual([]);
  });
});

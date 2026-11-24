/**
 * What the OpenAPI types must reject. Every case carries `@ts-expect-error`,
 * and an unused directive is itself a compile error, so a case that starts
 * compiling fails `yarn typecheck`. Keep one error per directive. Compiled by
 * `yarn typecheck`, never executed (see README.md).
 */
import { isStandardMethod } from 'openapi-spec';
import type {
  OAS30,
  OAS31,
  OAS32,
  OpenAPIDocument,
  OperationObject,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
  SchemaOrBoolean,
  ServerObject,
  SpecFamily,
  SpecVersionInfo,
  SpecVersionStatus,
  StandardMethod,
} from 'openapi-spec';

declare const pathItem30: OAS30.PathItemObject;
declare const pathItem31: OAS31.PathItemObject;
declare const pathItemAny: PathItemObject;
declare const server30: OAS30.ServerObject;
declare const response30: OAS30.ResponseObject;
declare const tag30: OAS30.TagObject;
declare const document30: OAS30.OpenAPIObject;
declare const document31: OAS31.OpenAPIObject;
declare const mediaType31: OAS31.MediaTypeObject;
declare const example31: OAS31.ExampleObject;
declare const schemaAny: SchemaObject;
declare const runtimeMethod: string;
declare const countsByMethod: Record<StandardMethod, number>;

// ---------------------------------------------------------------------------
// A misspelt field in a fresh literal (excess property check)
// ---------------------------------------------------------------------------

// @ts-expect-error `operationID` is not a field: the Operation Object spells it `operationId`
export const misspeltOperation: OAS31.OperationObject = { operationID: 'listPets' };

// @ts-expect-error the same check holds for the cross-version alias
export const misspeltOperationAlias: OperationObject = { operationID: 'listPets', responses: {} };

// @ts-expect-error `descripton` is not a field of the Info Object
export const misspeltInfo: OAS30.InfoObject = { title: 'Pet Store', version: '1', descripton: 'Pets' };

export const misspeltNested: OAS31.OpenAPIObject = {
  openapi: '3.1.2',
  info: { title: 'Pet Store', version: '1' },
  paths: {
    // @ts-expect-error `gett` is not an HTTP method of the Path Item Object
    '/pets': { gett: { responses: {} } },
  },
};

// @ts-expect-error `sumary` is not a field: a 3.1 Reference Object spells it `summary`
export const misspeltReference: ReferenceObject = { $ref: '#/components/schemas/Pet', sumary: 'A pet' };

// ---------------------------------------------------------------------------
// A value of the wrong type
// ---------------------------------------------------------------------------

export const numberTitle: OAS31.OpenAPIObject = {
  openapi: '3.1.2',
  // @ts-expect-error `info.title` is a string, not a number
  info: { title: 1, version: '1' },
};

export const numberTitleAlias: OpenAPIDocument = {
  openapi: '3.0.4',
  // @ts-expect-error `info.title` is a string here too, through the alias
  info: { title: 1, version: '1' },
  paths: {},
};

// @ts-expect-error `required` on a parameter is a boolean
export const stringRequired: OAS31.ParameterObject = { name: 'id', in: 'path', required: 'yes' };

// @ts-expect-error `tags` on an operation is an array of strings
export const stringTags: OAS31.OperationObject = { tags: 'pets' };

export const stringServers: OAS31.OpenAPIObject = {
  openapi: '3.1.2',
  info: { title: 'Pet Store', version: '1' },
  // @ts-expect-error `servers` is an array of Server Objects
  servers: 'https://example.com',
};

// @ts-expect-error `in` is a string, even though its known values are open
export const numberLocation: ParameterObject = { name: 'id', in: 1 };

// @ts-expect-error a Reference Object's `$ref` is a string
export const numberReference: ReferenceObject = { $ref: 1 };

// ---------------------------------------------------------------------------
// A required field left out
// ---------------------------------------------------------------------------

// @ts-expect-error `version` is required in the Info Object
export const noVersion: OAS31.InfoObject = { title: 'Pet Store' };

// @ts-expect-error `in` is required in the Parameter Object
export const noLocation: ParameterObject = { name: 'id' };

// @ts-expect-error `content` is required in the Request Body Object
export const noContent: RequestBodyObject = { description: 'A pet' };

// @ts-expect-error `url` is required in the Server Object
export const noUrl: ServerObject = { description: 'Production' };

// @ts-expect-error `openapi` is required in the root object
export const noVersionField: OpenAPIDocument = { info: { title: 'Pet Store', version: '1' }, paths: {} };

// ---------------------------------------------------------------------------
// A Schema Object is an object; its boolean form is `SchemaOrBoolean`
// ---------------------------------------------------------------------------

// @ts-expect-error a boolean is not a Schema Object
export const trueSchema: SchemaObject = true;

// @ts-expect-error `false` is not a Schema Object either
export const falseSchema: OAS31.SchemaObject = false;

// @ts-expect-error a string is not a schema in either form
export const stringSchema: SchemaOrBoolean = 'string';

// @ts-expect-error `null` is not a schema in either form
export const nullSchema: SchemaOrBoolean = null;

// @ts-expect-error `properties` in a 3.0 Schema Object holds schemas or references, never booleans
export const booleanProperty: OAS30.SchemaObject = { type: 'object', properties: { anything: true } };

// ---------------------------------------------------------------------------
// A document that is not an OpenAPI 3 document
// ---------------------------------------------------------------------------

export const swagger2Literal: OpenAPIDocument = {
  openapi: '3.0.4',
  info: { title: 'Pet Store', version: '1' },
  paths: {},
  // @ts-expect-error `host` is a 2.0 field: 3.x describes the host in `servers`
  host: 'pets.example.com',
};

declare const swagger2Document: {
  swagger: string;
  info: { title: string; version: string };
  host: string;
  basePath: string;
  paths: Record<string, never>;
};
// @ts-expect-error a parsed 2.0 document lacks `openapi` (the only error: a variable is not checked for extra fields)
export const swagger2Value: OpenAPIDocument = swagger2Document;

export const stringPaths: OpenAPIDocument = {
  openapi: '3.0.4',
  info: { title: 'Pet Store', version: '1' },
  // @ts-expect-error `paths` is a map of path to Path Item, not a string
  paths: 'paths.yaml',
};

// @ts-expect-error a Path Item holds operations, not a string
export const stringPathItem: OAS31.PathsObject = { '/pets': 'listPets' };

// ---------------------------------------------------------------------------
// Reading a field a version does not have
// ---------------------------------------------------------------------------

// @ts-expect-error `query` operations are new in 3.2
export const query30 = pathItem30.query;

// @ts-expect-error `additionalOperations` are new in 3.2
export const additional30 = pathItem30.additionalOperations;

// @ts-expect-error 3.1 has no `query` operation either
export const query31 = pathItem31.query;

// @ts-expect-error through the cross-version alias, a field only 3.2 defines needs narrowing first
export const queryAny = pathItemAny.query;

// @ts-expect-error a server's `name` is new in 3.2
export const serverName30 = server30.name;

// @ts-expect-error a response's `summary` is new in 3.2
export const summary30 = response30.summary;

// @ts-expect-error a tag's `parent` is new in 3.2
export const parent30 = tag30.parent;

// @ts-expect-error `$self` is new in 3.2
export const self30 = document30.$self;

// @ts-expect-error `$self` is not in 3.1
export const self31 = document31.$self;

// @ts-expect-error a media type's `itemSchema` is new in 3.2
export const itemSchema31 = mediaType31.itemSchema;

// @ts-expect-error an example's `dataValue` is new in 3.2
export const dataValue31 = example31.dataValue;

// @ts-expect-error `nullable` is 3.0 only, so the cross-version Schema Object needs narrowing before it is read
export const nullableAny = schemaAny.nullable;

// ---------------------------------------------------------------------------
// Writing a field a version does not have, in a fresh literal
// ---------------------------------------------------------------------------

// @ts-expect-error `query` operations are not in 3.1
export const query31Literal: OAS31.PathItemObject = { query: { responses: {} } };

// @ts-expect-error a server's `name` is not in 3.1
export const serverName31: OAS31.ServerObject = { url: 'https://example.com', name: 'production' };

// @ts-expect-error a tag's `parent` is not in 3.1
export const parent31: OAS31.TagObject = { name: 'pets', parent: 'nav' };

export const deviceFlow31: OAS31.OAuthFlowsObject = {
  // @ts-expect-error `deviceAuthorization` flows are new in 3.2 (the flow is complete, so this is the only error)
  deviceAuthorization: { deviceAuthorizationUrl: 'https://a', tokenUrl: 'https://t', scopes: {} },
};

// @ts-expect-error `nullable` was replaced by type arrays in 3.1
export const nullable31: OAS31.SchemaObject = { type: 'string', nullable: true };

// @ts-expect-error `exclusiveMinimum` is a boolean in 3.0; the numeric form is 3.1
export const numberExclusive30: OAS30.SchemaObject = { type: 'integer', exclusiveMinimum: 0 };

// @ts-expect-error 3.0 has one `type` per schema; type arrays are 3.1
export const typeArray30: OAS30.SchemaObject = { type: ['string', 'null'] };

// @ts-expect-error `const` is not a 3.0 keyword
export const const30: OAS30.SchemaObject = { const: 'pet' };

// @ts-expect-error `prefixItems` is not a 3.0 keyword
export const prefixItems30: OAS30.SchemaObject = { type: 'array', prefixItems: [{ type: 'string' }] };

// @ts-expect-error 3.0 requires `paths`
export const noPaths30: OAS30.OpenAPIObject = { openapi: '3.0.4', info: { title: 'Pet Store', version: '1' } };

// @ts-expect-error 3.0 requires `responses` on every operation
export const noResponses30: OAS30.OperationObject = { operationId: 'listPets' };

// @ts-expect-error `description` is required in a 3.0 response
export const noDescription30: OAS30.ResponseObject = { content: {} };

// @ts-expect-error `description` is required in a 3.1 response; it is optional from 3.2
export const noDescription31: OAS31.ResponseObject = { content: {} };

// @ts-expect-error `nme` is not a field: a 3.2 server's new field is `name`
export const misspeltServerName32: OAS32.ServerObject = { url: 'https://example.com', nme: 'production' };

// @ts-expect-error the 3.2 device flow field is `deviceAuthorizationUrl`
export const misspeltDeviceUrl32: OAS32.OAuthFlowObject = { deviceAuthorizationURL: 'https://a', scopes: {} };

// @ts-expect-error `nullable` is not a 3.2 keyword either
export const nullable32: OAS32.SchemaObject = { type: 'string', nullable: true };

// ---------------------------------------------------------------------------
// HTTP methods
// ---------------------------------------------------------------------------

/**
 * `isStandardMethod` returns a boolean, not a type guard (it ignores case, so `GET` is a standard
 * method but not the `StandardMethod` literal `get`): the method stays a `string` after the check, and a
 * lookup that narrows to `StandardMethod` is `getOperation`'s `fixed` entry (see methods.types.ts).
 */
export function isStandardMethodIsNotAGuard(): number {
  if (!isStandardMethod(runtimeMethod)) return 0;
  // @ts-expect-error a `string` is not narrowed by `isStandardMethod`, so it cannot index a `Record<StandardMethod, number>`
  return countsByMethod[runtimeMethod];
}

// ---------------------------------------------------------------------------
// The declared version: Swagger 2.0 is a supported family, not a status of its own
// ---------------------------------------------------------------------------

export function swagger2IsNoLongerAStatus(info: SpecVersionInfo): boolean {
  // @ts-expect-error `swagger-2.0` was the status of a recognised but unsupported document: it is `supported` (family `2.0`) now
  return info.status === 'swagger-2.0';
}

// @ts-expect-error `swagger-2.0` is not a status, as a value either
export const oldStatus: SpecVersionStatus = 'swagger-2.0';

// @ts-expect-error there is no `2.1` family: Swagger ended at `2.0`
export const swaggerOnePointOne: SpecFamily = '2.1';

// @ts-expect-error a family is a `major.minor` string, not the number YAML reads `2.0` as
export const numericFamily: SpecFamily = 2;

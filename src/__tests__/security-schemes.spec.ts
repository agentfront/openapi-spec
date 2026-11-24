import { SPEC_PROFILES, securitySchemeProblem } from '..';

const latest = SPEC_PROFILES['3.2'];
const latestTypes = 'apiKey, http, mutualTLS, oauth2, openIdConnect';

describe('securitySchemeProblem', () => {
  it('finds nothing wrong with a scheme the profile defines', () => {
    for (const scheme of [
      { type: 'http', scheme: 'bearer' },
      { type: 'oauth2', flows: {} },
      { type: 'openIdConnect', openIdConnectUrl: 'https://id.example.com' },
      { type: 'mutualTLS' },
      { type: 'apiKey', in: 'header', name: 'X-Key' },
      { type: 'apiKey', in: 'cookie', name: 'session' },
    ]) {
      expect(securitySchemeProblem(scheme, latest)).toBeUndefined();
    }
  });

  it('reports a type the profile does not define, compared exactly', () => {
    expect(securitySchemeProblem({ type: 'basic' }, latest)).toEqual({
      field: 'type',
      problem: `has the type "basic", which is none of ${latestTypes}`,
    });
    expect(securitySchemeProblem({ type: 'APIKEY', in: 'header', name: 'k' }, latest)?.field).toBe('type');
    expect(securitySchemeProblem({}, latest)).toEqual({ field: 'type', problem: `has the type undefined, which is none of ${latestTypes}` });
    expect(securitySchemeProblem({ type: 7 }, latest)?.problem).toBe(`has the type 7, which is none of ${latestTypes}`);
  });

  it('applies the rules of the profile it is given', () => {
    // Swagger 2.0 has `basic` and no `http`; OpenAPI 3.0 has no `mutualTLS`
    expect(securitySchemeProblem({ type: 'basic' }, SPEC_PROFILES['2.0'])).toBeUndefined();
    expect(securitySchemeProblem({ type: 'http', scheme: 'basic' }, SPEC_PROFILES['2.0'])?.field).toBe('type');
    expect(securitySchemeProblem({ type: 'mutualTLS' }, SPEC_PROFILES['3.0'])?.field).toBe('type');
    expect(securitySchemeProblem({ type: 'mutualTLS' }, SPEC_PROFILES['3.1'])).toBeUndefined();
  });

  it('reports an apiKey scheme sent where the profile has no such location', () => {
    expect(securitySchemeProblem({ type: 'apiKey', in: 'cookie', name: 'k' }, SPEC_PROFILES['2.0'])).toEqual({
      field: 'in',
      problem: 'is an apiKey scheme sent in "cookie", which is none of header, query',
    });
    expect(securitySchemeProblem({ type: 'apiKey', name: 'k' }, latest)).toEqual({
      field: 'in',
      problem: 'is an apiKey scheme sent in undefined, which is none of query, header, cookie',
    });
    expect(securitySchemeProblem({ type: 'apiKey', in: 'Header', name: 'k' }, latest)?.field).toBe('in');
  });

  it('reports an apiKey scheme without a usable name', () => {
    const noName = { field: 'name', problem: 'is an apiKey scheme without a name' };
    expect(securitySchemeProblem({ type: 'apiKey', in: 'query' }, latest)).toEqual(noName);
    expect(securitySchemeProblem({ type: 'apiKey', in: 'query', name: '' }, latest)).toEqual(noName);
    expect(securitySchemeProblem({ type: 'apiKey', in: 'query', name: 5 }, latest)).toEqual(noName);
  });
});

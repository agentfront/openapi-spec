import { wrapReferenceSiblings } from '../schema-references';

const code ={ $ref: '#/components/schemas/Code', maxLength: 5 };

describe('wrapReferenceSiblings', () => {
  it('puts the $ref of a schema with other constraints under allOf, wherever a schema sits', () => {
    const document = {
      components: { schemas: { A: { ...code }, B: { $ref: '#/x', allOf: [{ minLength: 2 }] } } },
      paths: {
        '/p': {
          parameters: [{ name: 'q', in: 'query', schema: { ...code } }],
          get: {
            responses: {
              200: {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: {
                      properties: { schema: { ...code }, list: { items: [{ ...code }] } },
                      oneOf: [{ ...code }],
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    wrapReferenceSiblings(document);
    const wrapped = { allOf: [{ $ref: '#/components/schemas/Code' }], maxLength: 5 };
    // After the members already there, so a pointer to one of them still names it
    expect(document.components.schemas).toEqual({ A: wrapped, B: { allOf: [{ minLength: 2 }, { $ref: '#/x' }] } });
    expect(document.paths['/p'].parameters[0].schema).toEqual(wrapped);
    const schema = document.paths['/p'].get.responses[200].content['application/json'].schema;
    expect(schema).toEqual({ properties: { schema: wrapped, list: { items: [wrapped] } }, oneOf: [wrapped] });
  });

  it('walks the entries of a map of objects whatever their names, a response named default included', () => {
    const document = {
      paths: { '/p': { get: { responses: { default: { content: { 'application/json': { schema: { ...code } } } } } } } },
      components: { responses: { example: { content: { 'text/plain': { schema: { ...code } } } } } },
    };
    wrapReferenceSiblings(document);
    const wrapped = { allOf: [{ $ref: '#/components/schemas/Code' }], maxLength: 5 };
    expect(document.paths['/p'].get.responses.default.content['application/json'].schema).toEqual(wrapped);
    expect(document.components.responses.example.content['text/plain'].schema).toEqual(wrapped);
  });

  it('leaves a $ref with only annotations beside it, a reference that is no schema, and data alone', () => {
    const document = {
      components: {
        schemas: {
          Described: { $ref: '#/x', description: 'd', summary: 's', title: 't', $comment: 'c', 'x-note': 1 },
          WithData: { type: 'object', default: { ...code }, examples: [{ ...code }], enum: [{ ...code }], 'x-a': { ...code } },
          NotARef: { $ref: 5, maxLength: 5 },
        },
        parameters: { p: { $ref: '#/components/parameters/q', required: true } },
      },
      paths: { '/p': { get: { responses: { 200: { $ref: '#/r', description: 'd' } } } } },
      'x-root': { schema: { ...code } },
    };
    const before = JSON.stringify(document);
    wrapReferenceSiblings(document);
    expect(JSON.stringify(document)).toBe(before);
  });
});

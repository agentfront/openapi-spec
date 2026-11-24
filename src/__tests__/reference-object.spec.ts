import { isReferenceObject } from '..';

describe('isReferenceObject', () => {
  it('accepts an object whose own `$ref` is a string, whatever else it holds', () => {
    expect(isReferenceObject({ $ref: '#/components/schemas/Pet' })).toBe(true);
    expect(isReferenceObject({ $ref: 'other.yaml#/Pet', summary: 's', description: 'd' })).toBe(true);
    // An empty reference is still a Reference Object (it names the document itself)
    expect(isReferenceObject({ $ref: '' })).toBe(true);
  });

  it('rejects a `$ref` that is not a string: such an object is read as what it otherwise is', () => {
    for (const $ref of [5, true, null, undefined, {}, ['#/a']]) expect(isReferenceObject({ $ref })).toBe(false);
  });

  it('rejects an inherited `$ref`: it is not the document', () => {
    expect(isReferenceObject(Object.create({ $ref: '#/components/schemas/Pet' }))).toBe(false);
  });

  it('rejects what is not an object', () => {
    for (const value of [null, undefined, '#/a', 7, true, Object.assign(['#/a'], { $ref: '#/a' })]) {
      expect(isReferenceObject(value)).toBe(false);
    }
  });

  it('reads `__proto__` as an own key, never the prototype', () => {
    expect(isReferenceObject(JSON.parse('{"__proto__": {"$ref": "#/a"}}'))).toBe(false);
    expect(isReferenceObject(JSON.parse('{"__proto__": {"$ref": "#/a"}, "$ref": "#/b"}'))).toBe(true);
  });
});

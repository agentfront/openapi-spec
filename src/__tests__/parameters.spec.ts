import { pathTemplateNames, withTextName } from '../parameters';

describe('pathTemplateNames', () => {
  it('lists the names of the template expressions of a path key, in order', () => {
    expect(pathTemplateNames('/a/{id}/{x}')).toEqual(['id', 'x']);
    expect(pathTemplateNames('/files/{name}.{format}')).toEqual(['name', 'format']);
  });

  it('finds none in a path without expressions, and none in empty braces', () => {
    expect(pathTemplateNames('/pets')).toEqual([]);
    expect(pathTemplateNames('/')).toEqual([]);
    expect(pathTemplateNames('/a/{}')).toEqual([]);
  });

  it('reads only the innermost braces of nested ones', () => {
    expect(pathTemplateNames('/a/{{x}}')).toEqual(['x']);
  });
});

describe('withTextName', () => {
  it('replaces a number or boolean name with its text, in a copy', () => {
    const parameter = { name: 2024, in: 'query' };
    expect(withTextName(parameter)).toEqual({ name: '2024', in: 'query' });
    expect(withTextName({ name: true, in: 'header' })).toEqual({ name: 'true', in: 'header' });
    expect(parameter.name).toBe(2024);
  });

  it('returns a parameter with a string name or no usable name as it is', () => {
    for (const parameter of [{ name: 'id', in: 'path' }, { name: '', in: 'query' }, { name: {}, in: 'query' }, { in: 'query' }]) {
      expect(withTextName(parameter)).toBe(parameter);
    }
  });

  it('returns a value that is not a parameter object as it is', () => {
    const list = [{ name: 1 }];
    expect(withTextName(list)).toBe(list);
    for (const value of [null, undefined, 'name', 7]) expect(withTextName(value)).toBe(value);
  });
});

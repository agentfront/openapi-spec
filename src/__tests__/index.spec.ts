import * as api from '../index';

describe('openapi-spec', () => {
  it('loads and exports nothing yet', () => {
    expect(Object.keys(api)).toEqual([]);
  });
});

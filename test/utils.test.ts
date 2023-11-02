import { pluralize } from '../src/utils';

describe('pluralize', () => {
  it('returns the singular form if the count is 1', () => {
    expect(pluralize(1, 'important warning', 'important warnings')).toEqual(
      '1 important warning',
    );
  });

  it('returns the plural form if the count is 2', () => {
    expect(pluralize(2, 'important warning', 'important warnings')).toEqual(
      '2 important warnings',
    );
  });

  it('returns the plural form if the count is 0', () => {
    expect(pluralize(0, 'important warning', 'important warnings')).toEqual(
      '0 important warnings',
    );
  });

  it('removes the count if includeCount is set to false', () => {
    expect(pluralize(2, 'It', 'They', false)).toEqual('They');
  });
});

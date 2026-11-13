import { cx } from './cx';

describe('cx', () => {
  it('joins the class names that are set', () => {
    expect(cx('a', undefined, false, 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is set', () => {
    expect(cx(undefined, false)).toBe('');
  });
});

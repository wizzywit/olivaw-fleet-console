import { render } from '@testing-library/react';
import { KeyHint } from './KeyHint';

describe('KeyHint', () => {
  it('renders each key as a kbd element', () => {
    const { container } = render(<KeyHint keys={['⌘', 'K']} />);
    expect([...container.querySelectorAll('kbd')].map((kbd) => kbd.textContent)).toEqual(['⌘', 'K']);
  });
});

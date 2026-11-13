import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive technology and keeps its size', () => {
    const { container } = render(<Skeleton width="120px" height="16px" />);
    const block = container.firstElementChild;
    expect(block).toHaveAttribute('aria-hidden', 'true');
    expect(block).toHaveStyle({ width: '120px', height: '16px' });
  });
});

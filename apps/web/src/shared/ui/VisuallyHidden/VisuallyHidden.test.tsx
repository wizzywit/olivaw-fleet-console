import { render, screen } from '@testing-library/react';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('keeps text available to assistive technology', () => {
    render(<VisuallyHidden>Sorted by urgency</VisuallyHidden>);
    expect(screen.getByText('Sorted by urgency')).toBeInTheDocument();
  });
});

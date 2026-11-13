import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('names the status in text, with a decorative icon', () => {
    const { container } = render(<StatusBadge tone="attention" label="Needs attention" />);
    expect(screen.getByText('Needs attention')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks a last-known value as stale in text and style', () => {
    render(<StatusBadge tone="working" label="Working" isStale />);
    const badge = screen.getByText('Working').closest('[data-stale]');
    expect(badge).toHaveAttribute('data-stale', 'true');
    expect(screen.getByText('(last known)')).toBeInTheDocument();
  });
});

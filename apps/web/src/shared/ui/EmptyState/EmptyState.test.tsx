import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('explains why it is empty and offers actions', () => {
    render(
      <EmptyState
        title="No robots match these filters"
        description="No robot at Airport T2 is below 5%."
        actions={<button>Clear filters</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'No robots match these filters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { PriorityTag } from './PriorityTag';

describe('PriorityTag', () => {
  it('names the priority in text', () => {
    render(<PriorityTag priority="high" />);
    expect(screen.getByText('High priority')).toBeInTheDocument();
  });
});

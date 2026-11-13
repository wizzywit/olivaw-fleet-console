import { render, screen } from '@testing-library/react';
import { RobotStatusBadge } from './RobotStatusBadge';

describe('RobotStatusBadge', () => {
  it('uses plain words for each status', () => {
    render(<RobotStatusBadge status="attention" />);
    expect(screen.getByText('Needs attention')).toBeInTheDocument();
  });
});

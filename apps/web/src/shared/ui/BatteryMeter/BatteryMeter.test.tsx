import { render, screen } from '@testing-library/react';
import { BatteryMeter } from './BatteryMeter';

describe('BatteryMeter', () => {
  it('states the value and that it is below the threshold', () => {
    render(<BatteryMeter percent={12} criticalPercent={15} charging={false} />);
    expect(screen.getByRole('meter', { name: 'Battery 12%, below the 15% threshold' })).toHaveAttribute(
      'aria-valuenow',
      '12',
    );
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('says when the robot is charging', () => {
    render(<BatteryMeter percent={40} criticalPercent={15} charging />);
    expect(screen.getByRole('meter', { name: 'Battery 40%, charging' })).toBeInTheDocument();
  });

  it('places the threshold mark at the critical percentage', () => {
    const { container } = render(<BatteryMeter percent={60} criticalPercent={15} charging={false} />);
    expect(container.querySelector('[data-threshold]')).toHaveStyle({ left: '15%' });
  });
});

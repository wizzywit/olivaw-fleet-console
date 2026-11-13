import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';

const items = [
  { id: 'table', label: 'Table', icon: <svg data-testid="table-icon" /> },
  { id: 'grid', label: 'Grid', icon: <svg data-testid="grid-icon" /> },
];

describe('SegmentedControl', () => {
  it('shows its label and one choice per segment, with the current one checked', () => {
    render(<SegmentedControl label="View" items={items} selectedId="grid" onChange={() => undefined} />);
    expect(screen.getByText('View')).toBeVisible();
    const group = screen.getByRole('radiogroup', { name: 'View' });
    expect(group).toContainElement(screen.getByRole('radio', { name: 'Grid' }));
    expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Table' })).not.toBeChecked();
  });

  it('keeps the icons out of the accessible name', () => {
    render(<SegmentedControl label="View" items={items} selectedId="table" onChange={() => undefined} />);
    expect(screen.getByTestId('table-icon').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('reports the chosen segment and never deselects the current one', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="View" items={items} selectedId="table" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Grid' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Table' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('grid');
  });
});

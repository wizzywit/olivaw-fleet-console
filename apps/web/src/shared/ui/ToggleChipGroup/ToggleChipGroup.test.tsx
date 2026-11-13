import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleChipGroup } from './ToggleChipGroup';

const items = [
  { id: 'all', label: 'All', count: '1,248' },
  { id: 'attention', label: 'Attention', count: '23', tone: 'attention' as const },
  { id: 'offline', label: 'Offline', count: '41' },
];

describe('ToggleChipGroup', () => {
  it('exposes the chips as a single-choice group with the selected one checked', () => {
    render(<ToggleChipGroup label="Status" items={items} selectedId="all" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /All/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Attention/ })).not.toBeChecked();
  });

  it('reports the chip the user picks with the mouse', async () => {
    const onChange = vi.fn();
    render(<ToggleChipGroup label="Status" items={items} selectedId="all" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: /Attention/ }));
    expect(onChange).toHaveBeenCalledWith('attention');
  });

  it('moves with arrow keys and picks with Enter', async () => {
    const onChange = vi.fn();
    render(<ToggleChipGroup label="Status" items={items} selectedId="all" onChange={onChange} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}');
    expect(onChange).toHaveBeenCalledWith('offline');
  });

  it('names the group', () => {
    render(<ToggleChipGroup label="Status" items={items} selectedId="all" onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup', { name: 'Status' })).toBeInTheDocument();
  });
});

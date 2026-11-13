import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SearchField } from './SearchField';

function Controlled({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState('dlv');
  return (
    <SearchField
      label="Search or filter robots"
      placeholder="Search"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('SearchField', () => {
  it('is labelled for assistive technology even though the label is hidden', () => {
    render(<SearchField label="Search or filter robots" placeholder="Search" value="" onChange={vi.fn()} />);
    expect(screen.getByRole('searchbox', { name: 'Search or filter robots' })).toBeInTheDocument();
  });

  it('clears on Escape', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole('searchbox'));
    await userEvent.keyboard('{Escape}');
    expect(onChange).toHaveBeenLastCalledWith('');
  });
});

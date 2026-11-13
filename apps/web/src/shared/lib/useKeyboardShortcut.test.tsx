import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useKeyboardShortcut } from './useKeyboardShortcut';

function Probe({ onKey, withModifier = false }: { onKey: () => void; withModifier?: boolean }) {
  useKeyboardShortcut({ key: withModifier ? 'k' : 'g', withModifier }, onKey);
  return <input aria-label="search" />;
}

describe('useKeyboardShortcut', () => {
  it('runs on the key anywhere on the page', async () => {
    const onKey = vi.fn();
    render(<Probe onKey={onKey} />);
    await userEvent.keyboard('g');
    expect(onKey).toHaveBeenCalledTimes(1);
  });

  it('ignores a plain key typed into a text field', async () => {
    const onKey = vi.fn();
    const { getByLabelText } = render(<Probe onKey={onKey} />);
    await userEvent.type(getByLabelText('search'), 'g');
    expect(onKey).not.toHaveBeenCalled();
  });

  it('accepts a modifier shortcut even in a text field, with Ctrl or Cmd', async () => {
    const onKey = vi.fn();
    const { getByLabelText } = render(<Probe onKey={onKey} withModifier />);
    await userEvent.click(getByLabelText('search'));
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await userEvent.keyboard('k');
    expect(onKey).toHaveBeenCalledTimes(2);
  });

  it('ignores a plain key while focus is inside an open dialog', async () => {
    const onKey = vi.fn();
    render(
      <>
        <Probe onKey={onKey} />
        <div role="dialog" aria-label="Palette">
          <button type="button">Item</button>
        </div>
      </>,
    );
    screen.getByRole('button', { name: 'Item' }).focus();
    await userEvent.keyboard('g');
    expect(onKey).not.toHaveBeenCalled();
  });
});

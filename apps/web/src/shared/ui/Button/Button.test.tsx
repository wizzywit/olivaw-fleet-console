import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('calls onPress when pressed', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Send to dock</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Send to dock' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = vi.fn();
    render(
      <Button onPress={onPress} isDisabled>
        Send to dock
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Send to dock' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('uses the aria-label as the name of an icon-only button', () => {
    render(<Button aria-label="More actions" onPress={vi.fn()} variant="secondary" />);
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });
});

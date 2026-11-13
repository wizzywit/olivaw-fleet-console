import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('is a toggle button when it filters', async () => {
    const onPress = vi.fn();
    render(
      <StatTile
        label="Hotel Isar"
        value="186"
        detail="6 need attention"
        isPressed={false}
        onPress={onPress}
      />,
    );
    const tile = screen.getByRole('button', { name: /Hotel Isar/ });
    expect(tile).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(tile);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('describes what its picture shows to screen readers', () => {
    render(
      <StatTile
        label="Hotel Isar"
        value="186"
        isPressed={false}
        onPress={() => undefined}
        description="Working 180 (97%)"
      />,
    );
    expect(screen.getByRole('button', { name: /Hotel Isar/ })).toHaveAccessibleDescription(
      'Working 180 (97%)',
    );
  });

  it('shows its tooltip when it gets keyboard focus', async () => {
    render(
      <StatTile
        label="Hotel Isar"
        value="186"
        isPressed={false}
        onPress={() => undefined}
        tooltip={<span>Working 180</span>}
      />,
    );
    await userEvent.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Working 180');
  });
});

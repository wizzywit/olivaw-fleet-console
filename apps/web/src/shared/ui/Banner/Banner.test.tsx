import { render, screen } from '@testing-library/react';
import { Banner } from './Banner';

describe('Banner', () => {
  it('announces urgent content as an alert', () => {
    render(
      <Banner tone="attention" title="Battery critical" role="alert">
        12% and not charging.
      </Banner>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Battery critical');
  });

  it('renders an action next to the message', () => {
    render(
      <Banner tone="neutral" title="Live updates paused" role="status" action={<button>Retry now</button>}>
        Showing the fleet as of 10:40:25.
      </Banner>,
    );
    expect(screen.getByRole('status')).toContainElement(screen.getByRole('button', { name: 'Retry now' }));
  });
});

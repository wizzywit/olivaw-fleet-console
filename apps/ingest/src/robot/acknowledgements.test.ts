import { describe, expect, it } from 'vitest';
import { createAcknowledgements } from './acknowledgements';

describe('acknowledgements', () => {
  it('counts every member as unacknowledged until someone acknowledges it', () => {
    const acknowledgements = createAcknowledgements();
    expect(acknowledgements.unacknowledgedIn('stuck', ['A', 'B'])).toBe(2);
    acknowledgements.acknowledge('stuck', ['A']);
    expect(acknowledgements.unacknowledgedIn('stuck', ['A', 'B'])).toBe(1);
  });

  it('keeps an acknowledgement to its reason', () => {
    const acknowledgements = createAcknowledgements();
    acknowledgements.acknowledge('stuck', ['A']);
    expect(acknowledgements.unacknowledgedIn('battery-critical', ['A'])).toBe(1);
  });

  it('treats a member that joined after the acknowledgement as unacknowledged', () => {
    const acknowledgements = createAcknowledgements();
    acknowledgements.acknowledge('stuck', ['A', 'B']);
    expect(acknowledgements.unacknowledgedIn('stuck', ['A', 'B', 'C'])).toBe(1);
  });

  it('forgets members that left, so a robot that comes back is unacknowledged again', () => {
    const acknowledgements = createAcknowledgements();
    acknowledgements.acknowledge('stuck', ['A', 'B']);
    acknowledgements.keepOnly('stuck', ['A']);
    expect(acknowledgements.unacknowledgedIn('stuck', ['A', 'B'])).toBe(1);
  });

  it('says whether an acknowledgement changed anything', () => {
    const acknowledgements = createAcknowledgements();
    expect(acknowledgements.acknowledge('stuck', ['A'])).toBe(true);
    expect(acknowledgements.acknowledge('stuck', ['A'])).toBe(false);
    expect(acknowledgements.acknowledge('stuck', [])).toBe(false);
  });
});

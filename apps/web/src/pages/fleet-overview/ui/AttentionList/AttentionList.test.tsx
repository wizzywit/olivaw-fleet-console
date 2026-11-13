import { act, render, screen } from '@testing-library/react';
import type { AttentionGroupView } from '../../use-cases/useFleetOverview';
import { AttentionList } from './AttentionList';

const group = (count: number): AttentionGroupView[] => [
  {
    reason: 'battery-critical',
    priority: 'high',
    count,
    countLabel: `${count} robots`,
    newCount: 0,
    worstHref: '/robots/DLV-0087',
    worstLabel: 'DLV-0087',
  },
];

const item = () => screen.getByText(/Battery critical/).closest('li');

describe('AttentionList', () => {
  it('highlights a group that grew for two seconds, even while the page keeps re-rendering', () => {
    vi.useFakeTimers();
    const { rerender } = render(<AttentionList groups={group(1)} total={1} />);
    rerender(<AttentionList groups={group(2)} total={2} />);
    expect(item()).toHaveAttribute('data-highlighted', 'true');
    for (let second = 0; second < 3; second += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      rerender(<AttentionList groups={group(2)} total={2} />);
    }
    expect(item()).toHaveAttribute('data-highlighted', 'false');
    vi.useRealTimers();
  });
});

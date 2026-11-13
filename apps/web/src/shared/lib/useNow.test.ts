import { act, renderHook } from '@testing-library/react';
import { useNow } from './useNow';

describe('useNow', () => {
  it('ticks at the given interval', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-13T10:00:00.000Z'));
    const { result } = renderHook(() => useNow(1000));
    expect(result.current.toISOString()).toBe('2026-11-13T10:00:00.000Z');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.toISOString()).toBe('2026-11-13T10:00:02.000Z');
    vi.useRealTimers();
  });
});

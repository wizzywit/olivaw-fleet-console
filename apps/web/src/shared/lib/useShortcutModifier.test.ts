import { renderHook } from '@testing-library/react';
import { useShortcutModifier } from './useShortcutModifier';

describe('useShortcutModifier', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names the Command key on Apple platforms', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    expect(renderHook(() => useShortcutModifier()).result.current).toBe('⌘');
  });

  it('names the Ctrl key on Windows and Linux', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
    expect(renderHook(() => useShortcutModifier()).result.current).toBe('Ctrl');
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Linux x86_64');
    expect(renderHook(() => useShortcutModifier()).result.current).toBe('Ctrl');
  });
});

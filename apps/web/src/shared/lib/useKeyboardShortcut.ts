'use client';

import { useEffect, useEffectEvent } from 'react';

export interface KeyboardShortcut {
  key: string;
  withModifier?: boolean;
}

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// Plain keys never fire while the user types in a field; Ctrl or Cmd shortcuts work everywhere.
export function useKeyboardShortcut(
  { key, withModifier = false }: KeyboardShortcut,
  onKey: () => void,
): void {
  const run = useEffectEvent(onKey);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key || event.altKey) return;
      if ((event.metaKey || event.ctrlKey) !== withModifier) return;
      if (!withModifier && isEditable(event.target)) return;
      event.preventDefault();
      run();
    };
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('keydown', handle);
    };
  }, [key, withModifier]);
}

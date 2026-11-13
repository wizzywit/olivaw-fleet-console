'use client';

import { useState, type FocusEvent } from 'react';

// The list holds its order while the pointer is over it or focus is inside it, so rows never move under the user.
export function useHoldWhileWorking(onHeldChange: (isHeld: boolean) => void, onLeave?: () => void) {
  const [hasFocus, setHasFocus] = useState(false);
  return {
    hasFocus,
    holdProps: {
      onMouseEnter: () => {
        onHeldChange(true);
      },
      onMouseLeave: () => {
        onHeldChange(false);
        onLeave?.();
      },
      onFocus: () => {
        setHasFocus(true);
        onHeldChange(true);
      },
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setHasFocus(false);
        onHeldChange(false);
      },
    },
  };
}

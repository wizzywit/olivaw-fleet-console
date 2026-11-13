'use client';

import { useRef, useState, type FocusEvent } from 'react';

const leftElement = (event: FocusEvent<HTMLElement>) => !event.currentTarget.contains(event.relatedTarget);

// The list holds its order while the pointer is over the list area or focus is inside it, so rows never move under the
// user. holdProps go on the whole list area (including the paused notice); focusProps on the focusable list itself.
export function useHoldWhileWorking(onHeldChange: (isHeld: boolean) => void, onLeave?: () => void) {
  const [hasFocus, setHasFocus] = useState(false);
  const working = useRef({ hovering: false, focusWithin: false });
  const update = (change: Partial<typeof working.current>) => {
    working.current = { ...working.current, ...change };
    onHeldChange(working.current.hovering || working.current.focusWithin);
  };
  return {
    hasFocus,
    holdProps: {
      onMouseEnter: () => {
        update({ hovering: true });
      },
      onMouseLeave: () => {
        update({ hovering: false });
        onLeave?.();
      },
      onFocus: () => {
        update({ focusWithin: true });
      },
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (leftElement(event)) update({ focusWithin: false });
      },
    },
    focusProps: {
      onFocus: () => {
        setHasFocus(true);
      },
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (leftElement(event)) setHasFocus(false);
      },
    },
  };
}

'use client';

import { useEffect, useRef } from 'react';
import type { AttentionReason } from '@/entities/robot';
import { Button, VisuallyHidden } from '@/shared/ui';
import { useAcknowledgeAttention } from '../../use-cases/useAcknowledgeAttention';
import styles from './AcknowledgeButton.module.css';

export interface AcknowledgeButtonProps {
  reason: AttentionReason;
  groupTitle: string;
  robotIds: readonly string[];
  isAcknowledged: boolean;
}

// Stays in place when the group becomes acknowledged: the button turns into a label that keeps keyboard focus, and a
// quiet live line says so, so neither focus nor the announcement is lost when the confirming patch arrives.
export function AcknowledgeButton({ reason, groupTitle, robotIds, isAcknowledged }: AcknowledgeButtonProps) {
  const { canAcknowledge, failed, acknowledge } = useAcknowledgeAttention(reason, robotIds);
  const hadFocus = useRef(false);
  const doneRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Only when focus fell to the page because the button went away, never pulling it back from somewhere else.
    if (isAcknowledged && hadFocus.current && document.activeElement === document.body)
      doneRef.current?.focus();
  }, [isAcknowledged]);

  return (
    <span
      className={styles.wrapper}
      onFocus={() => {
        hadFocus.current = true;
      }}
      onBlur={(event) => {
        if (event.relatedTarget !== null && !event.currentTarget.contains(event.relatedTarget))
          hadFocus.current = false;
      }}
    >
      {isAcknowledged ? (
        <span ref={doneRef} tabIndex={-1} className={styles.done}>
          Acknowledged
        </span>
      ) : (
        <Button
          variant="secondary"
          isDisabled={!canAcknowledge}
          aria-label={`Acknowledge ${groupTitle}`}
          onPress={acknowledge}
        >
          Acknowledge
        </Button>
      )}
      {failed && !isAcknowledged && (
        <span role="alert" className={styles.error}>
          Not saved. Try again.
        </span>
      )}
      <VisuallyHidden>
        <span role="status">{isAcknowledged ? `${groupTitle} acknowledged` : ''}</span>
      </VisuallyHidden>
    </span>
  );
}

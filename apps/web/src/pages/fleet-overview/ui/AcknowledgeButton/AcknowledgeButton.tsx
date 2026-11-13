'use client';

import type { AttentionReason } from '@/entities/robot';
import { Button } from '@/shared/ui';
import { useAcknowledgeAttention } from '../../use-cases/useAcknowledgeAttention';
import styles from './AcknowledgeButton.module.css';

export interface AcknowledgeButtonProps {
  reason: AttentionReason;
  groupTitle: string;
  robotIds: readonly string[];
}

export function AcknowledgeButton({ reason, groupTitle, robotIds }: AcknowledgeButtonProps) {
  const { canAcknowledge, failed, acknowledge } = useAcknowledgeAttention(reason, robotIds);
  return (
    <span className={styles.wrapper}>
      <Button
        variant="secondary"
        isDisabled={!canAcknowledge}
        aria-label={`Acknowledge ${groupTitle}`}
        onPress={acknowledge}
      >
        Acknowledge
      </Button>
      {failed && (
        <span role="alert" className={styles.error}>
          Not saved. Try again.
        </span>
      )}
    </span>
  );
}

'use client';

import type { AttentionReason } from '@/entities/robot';
import { Button } from '@/shared/ui';
import { useMarkAttentionSeen } from '../../use-cases/useMarkAttentionSeen';
import styles from './MarkSeenButton.module.css';

export interface MarkSeenButtonProps {
  reason: AttentionReason;
  groupTitle: string;
  robotIds: readonly string[];
}

export function MarkSeenButton({ reason, groupTitle, robotIds }: MarkSeenButtonProps) {
  const { canMark, failed, markSeen } = useMarkAttentionSeen(reason, robotIds);
  return (
    <span className={styles.wrapper}>
      <Button
        variant="secondary"
        isDisabled={!canMark}
        aria-label={`Mark ${groupTitle} seen`}
        onPress={markSeen}
      >
        Mark seen
      </Button>
      {failed && (
        <span role="alert" className={styles.error}>
          Not saved. Try again.
        </span>
      )}
    </span>
  );
}

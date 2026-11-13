'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { AttentionReason } from '@/entities/robot';
import { PriorityTag } from '@/shared/ui';
import type { AttentionGroupView } from '../../use-cases/useFleetOverview';
import styles from './AttentionList.module.css';

const copy: Record<AttentionReason, { title: string; action: string }> = {
  'emergency-stop': { title: 'Emergency stop', action: 'Check the area, then release the stop on site' },
  'error-reported': { title: 'Error reported', action: 'Open the robot and follow the error' },
  'battery-critical': { title: 'Battery critical', action: 'Send the robot to a dock' },
  stuck: { title: 'Stopped with a task', action: 'Check the path, then resume the task' },
};

const highlightMs = 2000;

// Groups that just grew get a short highlight so a new problem is noticed without anything moving. The effect is keyed
// on the counts, not the groups array, because the page re-renders every second with a new array.
function useGrowthHighlight(groups: AttentionGroupView[]): Set<string> {
  const countsKey = groups.map((group) => `${group.reason}:${String(group.count)}`).join('|');
  const previous = useRef(new Map<string, number>());
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  useEffect(() => {
    const counts = new Map(
      countsKey
        .split('|')
        .filter(Boolean)
        .map((entry) => {
          const [reason = '', count = '0'] = entry.split(':');
          return [reason, Number(count)] as const;
        }),
    );
    const grown = [...counts].filter(([reason, count]) => count > (previous.current.get(reason) ?? count));
    previous.current = counts;
    if (grown.length === 0) return;
    setHighlighted(new Set(grown.map(([reason]) => reason)));
    const timer = setTimeout(() => {
      setHighlighted(new Set());
    }, highlightMs);
    return () => {
      clearTimeout(timer);
    };
  }, [countsKey]);
  return highlighted;
}

export function AttentionList({ groups, total }: { groups: AttentionGroupView[]; total: number }) {
  const highlighted = useGrowthHighlight(groups);
  return (
    <section aria-labelledby="attention-heading" className={styles.panel}>
      <h2 id="attention-heading" className={styles.heading}>
        Needs your attention · {total} {total === 1 ? 'robot' : 'robots'}
      </h2>
      {groups.length === 0 ? (
        <p className={styles.none}>Nothing needs you right now.</p>
      ) : (
        <ul className={styles.list}>
          {groups.map((group) => (
            <li key={group.reason} className={styles.group} data-highlighted={highlighted.has(group.reason)}>
              <div className={styles.summary}>
                <span className={styles.title}>
                  {copy[group.reason].title} · {group.countLabel}
                </span>
                <PriorityTag priority={group.priority} />
                {group.newCount > 0 && <span className={styles.new}>{group.newCount} new</span>}
              </div>
              <p className={styles.action}>{copy[group.reason].action}</p>
              <p className={styles.worst}>
                Most urgent: <Link href={group.worstHref}>{group.worstLabel}</Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

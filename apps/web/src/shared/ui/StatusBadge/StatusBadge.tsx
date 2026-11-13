import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import { cx } from '../../lib/cx';
import styles from './StatusBadge.module.css';

export type StatusTone = 'working' | 'charging' | 'idle' | 'attention' | 'offline';

const iconPaths: Record<StatusTone, string> = {
  working: 'M6 1a5 5 0 1 1 0 10A5 5 0 0 1 6 1z',
  charging: 'M7 0 2 7h3l-1 5 5-7H6z',
  idle: 'M3 2h2v8H3zM7 2h2v8H7z',
  attention: 'M6 0.5 11.5 11h-11zM5.3 4h1.4v3.6H5.3zM5.3 8.4h1.4v1.4H5.3z',
  offline:
    'M6 1a5 5 0 1 1 0 10A5 5 0 0 1 6 1zm0 1.6a3.4 3.4 0 0 0-2.7 5.5l4.8-4.8A3.4 3.4 0 0 0 6 2.6zm2.7 1.3-4.8 4.8a3.4 3.4 0 0 0 4.8-4.8z',
};

export interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  isStale?: boolean;
}

export function StatusBadge({ tone, label, isStale = false }: StatusBadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone])} data-stale={isStale}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d={iconPaths[tone]} fill="currentColor" fillRule="evenodd" />
      </svg>
      {label}
      {isStale && <VisuallyHidden>(last known)</VisuallyHidden>}
    </span>
  );
}

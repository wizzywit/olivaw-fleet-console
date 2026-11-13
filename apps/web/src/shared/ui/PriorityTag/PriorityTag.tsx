import { clsx } from 'clsx';
import styles from './PriorityTag.module.css';

export function PriorityTag({ priority }: { priority: 'high' | 'medium' }) {
  return (
    <span className={clsx(styles.tag, styles[priority])}>
      {priority === 'high' ? 'High priority' : 'Medium priority'}
    </span>
  );
}

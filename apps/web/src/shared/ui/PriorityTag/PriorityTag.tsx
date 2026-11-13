import { cx } from '../../lib/cx';
import styles from './PriorityTag.module.css';

export function PriorityTag({ priority }: { priority: 'high' | 'medium' }) {
  return (
    <span className={cx(styles.tag, styles[priority])}>
      {priority === 'high' ? 'High priority' : 'Medium priority'}
    </span>
  );
}

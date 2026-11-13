import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Banner.module.css';

export interface BannerProps {
  tone: 'attention' | 'neutral';
  title: string;
  role: 'alert' | 'status';
  children: ReactNode;
  action?: ReactNode;
}

export function Banner({ tone, title, role, children, action }: BannerProps) {
  return (
    <div role={role} className={cx(styles.banner, styles[tone])}>
      <div className={styles.body}>
        <strong className={styles.title}>{title}</strong>
        <span className={styles.message}>{children}</span>
      </div>
      {action}
    </div>
  );
}

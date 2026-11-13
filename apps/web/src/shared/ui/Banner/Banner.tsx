import type { ReactNode } from 'react';
import { clsx } from 'clsx';
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
    <div role={role} className={clsx(styles.banner, styles[tone])}>
      <div className={styles.body}>
        <strong className={styles.title}>{title}</strong>
        <span className={styles.message}>{children}</span>
      </div>
      {action}
    </div>
  );
}

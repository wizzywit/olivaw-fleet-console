'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { FleetSearchField } from '@/features/filter-fleet';
import { ThemeToggleButton } from '@/features/toggle-theme';
import { Button } from '@/shared/ui';
import { useAppHeader } from '../../use-cases/useAppHeader';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const header = useAppHeader();
  return (
    <header className={styles.header}>
      <span className={styles.brand}>olivaw</span>
      <nav aria-label="Main" className={styles.nav}>
        <Link href="/" className={styles.link} aria-current={header.isFleetCurrent ? 'page' : undefined}>
          Fleet
        </Link>
        <Link
          href="/?status=attention"
          className={styles.link}
          aria-current={header.isAttentionCurrent ? 'page' : undefined}
        >
          Needs attention{' '}
          {header.attentionCountLabel !== null && (
            <span className={styles.count}>{header.attentionCountLabel}</span>
          )}
        </Link>
      </nav>
      <div className={styles.search}>
        <FleetSearchField />
      </div>
      <span role="status" className={styles.status}>
        <span aria-hidden="true" className={clsx(styles.dot, styles[header.tone])} />
        {header.statusText}
      </span>
      <Button variant="secondary" onPress={header.togglePause}>
        {header.pauseLabel}
      </Button>
      <ThemeToggleButton />
    </header>
  );
}

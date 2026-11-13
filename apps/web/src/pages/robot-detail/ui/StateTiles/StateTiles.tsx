import type { ReactNode } from 'react';
import styles from './StateTiles.module.css';

export interface StateTile {
  label: string;
  value: ReactNode;
  hint: string;
}

export function StateTiles({ tiles }: { tiles: StateTile[] }) {
  return (
    <section aria-label="Current state" className={styles.tiles}>
      {tiles.map((tile) => (
        <div key={tile.label} className={styles.tile}>
          <span className={styles.label}>{tile.label}</span>
          <span className={styles.value}>{tile.value}</span>
          <span className={styles.hint}>{tile.hint}</span>
        </div>
      ))}
    </section>
  );
}

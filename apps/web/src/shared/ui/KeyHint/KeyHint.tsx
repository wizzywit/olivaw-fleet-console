import { Fragment } from 'react';
import styles from './KeyHint.module.css';

export function KeyHint({ keys }: { keys: string[] }) {
  return (
    <span className={styles.hint}>
      {keys.map((key, index) => (
        <Fragment key={key}>
          {/* A real space between keys, so "Ctrl K" reads as two keys to assistive technology. */}
          {index > 0 && ' '}
          <kbd className={styles.key}>{key}</kbd>
        </Fragment>
      ))}
    </span>
  );
}

import styles from './KeyHint.module.css';

export function KeyHint({ keys }: { keys: string[] }) {
  return (
    <span className={styles.hint}>
      {keys.map((key) => (
        <kbd key={key} className={styles.key}>
          {key}
        </kbd>
      ))}
    </span>
  );
}

import styles from './ErrorList.module.css';

export interface ErrorItem {
  key: string;
  levelLabel: string;
  code: string;
  description: string | null;
}

export function ErrorList({ errors }: { errors: ErrorItem[] }) {
  return (
    <section aria-labelledby="errors-heading" className={styles.panel}>
      <h2 id="errors-heading" className={styles.heading}>
        Reported errors · {errors.length}
      </h2>
      {errors.length === 0 ? (
        <p className={styles.none}>No errors reported.</p>
      ) : (
        <ul className={styles.list}>
          {errors.map((error) => (
            <li key={error.key} className={styles.error}>
              <strong>{error.levelLabel}</strong> · {error.code}
              {error.description !== null && <span className={styles.description}>{error.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

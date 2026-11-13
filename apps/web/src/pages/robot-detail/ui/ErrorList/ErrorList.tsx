import { Button } from '@/shared/ui';
import styles from './ErrorList.module.css';

export interface ErrorItem {
  key: string;
  levelLabel: string;
  code: string;
  description: string | null;
}

export function ErrorList({ errors, onRetry }: { errors: ErrorItem[] | null; onRetry: () => void }) {
  return (
    <section aria-labelledby="errors-heading" className={styles.panel}>
      <h2 id="errors-heading" className={styles.heading}>
        {errors === null ? 'Reported errors' : `Reported errors · ${String(errors.length)}`}
      </h2>
      {errors === null && (
        <div className={styles.none}>
          <p>Error details could not be loaded.</p>
          <Button variant="secondary" onPress={onRetry}>
            Retry
          </Button>
        </div>
      )}
      {errors?.length === 0 && <p className={styles.none}>No errors reported.</p>}
      {errors !== null && errors.length > 0 && (
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

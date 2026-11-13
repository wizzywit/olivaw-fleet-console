import styles from './Skeleton.module.css';

export function Skeleton({ width, height }: { width: string; height: string }) {
  return <span className={styles.skeleton} aria-hidden="true" style={{ width, height }} />;
}

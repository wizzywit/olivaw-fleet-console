import styles from './RawMessagePanel.module.css';

export interface RawMessageView {
  protocolLabel: string;
  receivedLabel: string;
  json: string;
}

export function RawMessagePanel({ raw }: { raw: RawMessageView }) {
  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>
        Raw message · {raw.protocolLabel} · received {raw.receivedLabel}
      </summary>
      <pre className={styles.code}>{raw.json}</pre>
    </details>
  );
}

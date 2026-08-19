import styles from './StatusView.module.css';

export function Loading() {
  return (
    <div className={styles.status} role="status" aria-live="polite">
      <p>Loading client data…</p>
    </div>
  );
}

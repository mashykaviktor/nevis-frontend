import { Button } from '../ui/Button';
import styles from './StatusView.module.css';

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <div className={styles.status} role="alert">
      <p>{message}</p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
}

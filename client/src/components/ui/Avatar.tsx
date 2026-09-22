import type { CSSProperties } from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  initials: string;
  color: string;
}

/** A small circular initials badge, extracted from RowName's employee avatar. */
export function Avatar({ initials, color }: AvatarProps) {
  return (
    <span className={styles.avatar} style={{ '--avatar-bg': color } as CSSProperties} aria-hidden="true">
      {initials}
    </span>
  );
}

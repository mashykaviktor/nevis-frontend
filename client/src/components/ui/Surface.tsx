import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Surface.module.css';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Shared card treatment for the chart and table containers, which
 * previously had inconsistent border/radius/padding of their own (chart:
 * radius + padding, no border; table: radius, no padding, a stray
 * border-top with nothing on the other three sides).
 */
export function Surface({ className, children, ...rest }: SurfaceProps) {
  const classes = className ? `${styles.surface} ${className}` : styles.surface;

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

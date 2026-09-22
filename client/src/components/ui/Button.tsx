import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'default' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

/**
 * The two button chromes the app actually needs: a bordered text button
 * (StatusView's retry action) and an icon-only square button
 * (ExpandToggle's chevron). No separate IconButton — variant covers it.
 */
export function Button({ variant = 'default', type = 'button', className, children, ...rest }: ButtonProps) {
  const variantClass = variant === 'icon' ? styles.icon : styles.default;
  const classes = className ? `${styles.button} ${variantClass} ${className}` : `${styles.button} ${variantClass}`;

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}

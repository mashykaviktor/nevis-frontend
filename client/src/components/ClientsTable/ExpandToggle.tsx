import styles from './ExpandToggle.module.css';

interface ExpandToggleProps {
  expanded: boolean;
  label: string;
  onToggle: () => void;
}

/**
 * The row's disclosure control. `aria-expanded` carries the state; the
 * visible chevron is purely decorative (`aria-hidden`), and the accessible
 * name — passed in as `label` — is what actually reaches assistive tech,
 * since a plain `<tr>`/`<td>` structure has no `aria-level` support.
 */
export function ExpandToggle({ expanded, label, onToggle }: ExpandToggleProps) {
  return (
    <button type="button" className={styles.toggle} aria-expanded={expanded} onClick={onToggle}>
      <svg
        className={styles.chevron}
        data-expanded={expanded || undefined}
        width="10"
        height="10"
        viewBox="0 0 10 10"
        aria-hidden="true"
      >
        <path
          d="M2 1 L7 5 L2 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="visually-hidden">{label}</span>
    </button>
  );
}

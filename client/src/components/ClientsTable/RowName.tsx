import type { ClientNode } from '@nevis/shared';
import type { NodeKind } from '../../lib/tree';
import styles from './RowName.module.css';

interface RowNameProps {
  node: ClientNode;
  kind: NodeKind;
}

/**
 * Renders a row's name per the mockup's per-kind variants: the company
 * name is emphasized, employees get an initials avatar (the data has no
 * avatar image, so this is a documented stand-in — see README), and
 * branches/channels are plain text.
 */
export function RowName({ node, kind }: RowNameProps) {
  return (
    <span className={styles.name}>
      {kind === 'employee' && (
        <span className={styles.avatar} aria-hidden="true">
          {getInitials(node.name)}
        </span>
      )}
      <span className={kind === 'company' ? styles.companyName : undefined}>{node.name}</span>
    </span>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

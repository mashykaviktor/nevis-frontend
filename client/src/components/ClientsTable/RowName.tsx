import type { CSSProperties } from 'react';
import type { ClientNode } from '@nevis/shared';
import type { NodeKind } from '../../lib/tree';
import styles from './RowName.module.css';

interface RowNameProps {
  node: ClientNode;
  kind: NodeKind;
}

/**
 * Renders a row's name per the mockup's per-kind variants: employees get
 * an avatar, branches/channels/company are plain text. The mockup's
 * employee avatars are real photos; the data has no photo field (see
 * README, "Avatars"), so this renders a deterministic initials-on-color
 * placeholder instead — same size/position as the mockup, sized to its
 * 20px circle.
 */
export function RowName({ node, kind }: RowNameProps) {
  return (
    <span className={styles.name}>
      {kind === 'employee' && (
        <span
          className={styles.avatar}
          style={{ '--avatar-bg': avatarColor(node.id) } as CSSProperties}
          aria-hidden="true"
        >
          {getInitials(node.name)}
        </span>
      )}
      <span>{node.name}</span>
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

/** A handful of saturated, white-text-legible hues — distinct from the pale chart palette. */
const AVATAR_COLORS = ['#6355c7', '#a75e6e', '#1f7a5c', '#a15c1f', '#2f6fa3', '#7a3f8f'];

/** Deterministic per-person color so each avatar reads as distinct, like the mockup's photos. */
function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  // Modulo against the array's own length always yields a valid index.
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] as string;
}

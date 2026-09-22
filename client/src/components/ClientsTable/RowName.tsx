import type { ClientNode } from '@nevis/shared';
import type { NodeKind } from '../../lib/tree';
import { Avatar } from '../ui/Avatar';
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
      {kind === 'employee' && <Avatar initials={getInitials(node.name)} color={avatarColor(node.id)} />}
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

/** Saturated, white-text-legible hues from tokens.css — distinct from the pale chart palette. */
const AVATAR_COLOR_TOKENS = [
  'var(--avatar-color-1)',
  'var(--avatar-color-2)',
  'var(--avatar-color-3)',
  'var(--avatar-color-4)',
  'var(--avatar-color-5)',
  'var(--avatar-color-6)',
];

/** Deterministic per-person color so each avatar reads as distinct, like the mockup's photos. */
function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  // Modulo against the array's own length always yields a valid index.
  return AVATAR_COLOR_TOKENS[Math.abs(hash) % AVATAR_COLOR_TOKENS.length] as string;
}

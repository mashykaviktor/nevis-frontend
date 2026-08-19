import { getChildren, getChildrenKind, getNodeKind, type ChildrenKind, type FlatRow } from '../../lib/tree';
import { ExpandToggle } from './ExpandToggle';
import { RowName } from './RowName';
import styles from './ClientRow.module.css';

interface ClientRowProps {
  row: FlatRow;
  expanded: boolean;
  onToggle: (row: FlatRow) => void;
}

export function ClientRow({ row, expanded, onToggle }: ClientRowProps) {
  const { node, depth, hasChildren } = row;
  const kind = getNodeKind(depth);

  return (
    <tr aria-expanded={hasChildren ? expanded : undefined}>
      {/*
        Explicit aria-label keeps this cell's accessible name to just the
        row's own name — without it, "name from content" would also pull in
        the toggle button's visually-hidden label (level/child-count text),
        producing a redundant announcement every time a value cell is read.
      */}
      <th scope="row" className={styles.nameCell} aria-label={node.name}>
        <div className={styles.nameCellInner} style={{ paddingLeft: `${depth * 1.25}rem` }}>
          {hasChildren ? (
            <ExpandToggle expanded={expanded} onToggle={() => onToggle(row)} label={buildToggleLabel(row, expanded)} />
          ) : (
            <span className={styles.togglePlaceholder} aria-hidden="true" />
          )}
          <RowName node={node} kind={kind} />
        </div>
      </th>
      {node.values.map((value, index) => (
        <td key={index} className={styles.valueCell}>
          {value}
        </td>
      ))}
    </tr>
  );
}

/**
 * The toggle's accessible name carries depth/child-count context, since a
 * plain `<tr>` can't expose `aria-level` to assistive tech (that only
 * works inside `role="treegrid"`, out of scope here — see README).
 */
function buildToggleLabel(row: FlatRow, expanded: boolean): string {
  const { node, depth } = row;
  const kind = getChildrenKind(node);
  const count = getChildren(node)?.length ?? 0;
  const action = expanded ? 'Collapse' : 'Expand';
  const countPart = kind ? `, ${count} ${singularize(kind, count)}` : '';
  return `${action} ${node.name}, level ${depth + 1}${countPart}`;
}

const SINGULAR: Record<ChildrenKind, string> = {
  branches: 'branch',
  employees: 'employee',
  channels: 'channel',
};

function singularize(kind: ChildrenKind, count: number): string {
  return count === 1 ? SINGULAR[kind] : kind;
}

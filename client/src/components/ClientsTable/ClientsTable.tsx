import type { FlatRow } from '../../lib/tree';
import { ClientRow } from './ClientRow';
import styles from './ClientsTable.module.css';

interface ClientsTableProps {
  rows: FlatRow[];
  months: string[];
  expandedIds: ReadonlySet<string>;
  onToggle: (row: FlatRow) => void;
}

/**
 * Purely presentational: takes an already-flattened row list and renders
 * it. All expand/collapse state lives with the caller (see Dashboard),
 * keeping this component trivial to test and reuse.
 */
export function ClientsTable({ rows, months, expandedIds, onToggle }: ClientsTableProps) {
  return (
    <div
      className={styles.scrollWrapper}
      role="region"
      aria-label="Clients table, scroll horizontally for more months"
      tabIndex={0}
    >
      <table className={styles.table}>
        <caption className="visually-hidden">
          Client book by month, expandable by branch, adviser, and acquisition channel
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.nameHeaderCell}>
              Name
            </th>
            {months.map((month) => (
              <th scope="col" key={month} className={styles.monthHeaderCell}>
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ClientRow key={row.node.id} row={row} expanded={expandedIds.has(row.node.id)} onToggle={onToggle} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

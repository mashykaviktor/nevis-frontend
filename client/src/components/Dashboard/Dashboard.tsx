import { useMemo, useState } from 'react';
import type { ClientNode } from '@nevis/shared';
import { useCompanyData } from '../../hooks/useCompanyData';
import { useExpandedRows } from '../../hooks/useExpandedRows';
import { flattenVisibleRows, type FlatRow } from '../../lib/tree';
import { Loading } from '../StatusView/Loading';
import { ErrorView } from '../StatusView/ErrorView';
import { ClientsTable } from '../ClientsTable/ClientsTable';
import { ClientsChart } from '../ClientsChart/ClientsChart';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const state = useCompanyData();

  if (state.status === 'loading') {
    return <Loading />;
  }

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={state.retry} />;
  }

  return <DashboardContent company={state.data.company} months={state.data.months} />;
}

interface DashboardContentProps {
  company: ClientNode;
  months: string[];
}

function DashboardContent({ company, months }: DashboardContentProps) {
  const { expandedIds, toggle } = useExpandedRows([company.id]);
  const [announcement, setAnnouncement] = useState('');
  const rows = useMemo(() => flattenVisibleRows(company, expandedIds), [company, expandedIds]);

  const handleToggle = (row: FlatRow) => {
    const willExpand = !expandedIds.has(row.node.id);

    if (willExpand) {
      // Count everything that becomes visible, not just direct children — a
      // descendant may already be expanded from before (its state survives a
      // parent collapse, see useExpandedRows), so re-expanding this node can
      // reveal grandchildren too.
      const expandedWithNode = new Set(expandedIds);
      expandedWithNode.add(row.node.id);
      const revealedCount = flattenVisibleRows(row.node, expandedWithNode).length - 1;
      setAnnouncement(`${row.node.name} expanded, ${revealedCount} row${revealedCount === 1 ? '' : 's'} shown`);
    } else {
      setAnnouncement(`${row.node.name} collapsed`);
    }

    toggle(row.node.id);
  };

  return (
    <main className={styles.dashboard}>
      <h1 className={styles.heading}>Clients</h1>
      <ClientsChart node={company} months={months} />
      <ClientsTable rows={rows} months={months} expandedIds={expandedIds} onToggle={handleToggle} />
      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </main>
  );
}

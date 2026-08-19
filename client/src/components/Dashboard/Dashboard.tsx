import { useMemo, useState } from 'react';
import type { ClientNode } from '@nevis/shared';
import { useCompanyData } from '../../hooks/useCompanyData';
import { useExpandedRows } from '../../hooks/useExpandedRows';
import { flattenVisibleRows, getChildren, type FlatRow } from '../../lib/tree';
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
    toggle(row.node.id);

    const childCount = getChildren(row.node)?.length ?? 0;
    setAnnouncement(
      willExpand
        ? `${row.node.name} expanded, ${childCount} row${childCount === 1 ? '' : 's'} shown`
        : `${row.node.name} collapsed`,
    );
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

import { useCompanyData } from '../../hooks/useCompanyData';
import { Loading } from '../StatusView/Loading';
import { ErrorView } from '../StatusView/ErrorView';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const state = useCompanyData();

  if (state.status === 'loading') {
    return <Loading />;
  }

  if (state.status === 'error') {
    return <ErrorView message={state.error.message} onRetry={state.retry} />;
  }

  const { company, months } = state.data;

  return (
    <main className={styles.dashboard}>
      <h1>Clients</h1>
      {/* Placeholder until ClientsChart/ClientsTable land in later stages. */}
      <p>
        Loaded &quot;{company.name}&quot; across {months.length} months.
      </p>
    </main>
  );
}

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ClientNode } from '@nevis/shared';
import { getChartSeries, toChartData } from '../../lib/tree';
import styles from './ClientsChart.module.css';

interface ClientsChartProps {
  node: ClientNode;
  months: string[];
}

const CHART_COLORS = ['#7c6cf0', '#f2a65a', '#b0473e', '#4f9d69', '#3b82c4'];

/**
 * A real stacked bar chart: one series per direct child of `node` (see
 * `getChartSeries`), so it always stacks something meaningful instead of
 * fabricating a channel breakdown the data doesn't have. The chart's SVG
 * is opaque to assistive tech (role="img") — the table below it is the
 * accessible equivalent for the same data (see README).
 */
export function ClientsChart({ node, months }: ClientsChartProps) {
  const series = getChartSeries(node);
  const data = toChartData(node, months);
  const seriesNames = series.map((s) => s.name).join(', ');

  return (
    <div
      className={styles.chartWrapper}
      role="img"
      aria-label={`Stacked bar chart of ${node.name} client counts by month, broken down by ${seriesNames}`}
    >
      <div className={styles.chartInner}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 12 }} width={40} allowDecimals={false} />
            <Tooltip />
            <Legend />
            {series.map((s, index) => (
              <Bar key={s.name} dataKey={s.name} stackId="clients" fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

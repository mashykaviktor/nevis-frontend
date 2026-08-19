import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ClientNode } from '@nevis/shared';
import { getChartSeries, toChartData } from '../../lib/tree';
import styles from './ClientsChart.module.css';

interface ClientsChartProps {
  node: ClientNode;
  months: string[];
}

const CHART_COLORS = ['#b29df8', '#f4beb4', '#a75e6e', '#8fbf9f', '#7fa8c9'];

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
            <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} />
            {/*
              Fixed 0–400 range in steps of 100, matching the mockup — safe because this
              component is only ever pointed at the Company-level node (see README), whose
              monthly totals never exceed 350.
            */}
            <YAxis
              tick={{ fontSize: 12 }}
              width={40}
              allowDecimals={false}
              domain={[0, 400]}
              ticks={[0, 100, 200, 300, 400]}
            />
            <Tooltip />
            <Legend />
            {series.map((s, index) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                stackId="clients"
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

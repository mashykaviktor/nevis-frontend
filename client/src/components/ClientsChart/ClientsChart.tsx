import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ClientNode } from '@nevis/shared';
import { getChartSeries, toChartData } from '../../lib/tree';
import { Surface } from '../ui/Surface';
import styles from './ClientsChart.module.css';

interface ClientsChartProps {
  node: ClientNode;
  months: string[];
}

// Neutral tonal palette for the branch stack — not the design's literal
// channel hexes (see tokens.css --chart-color-*).
const CHART_COLORS = ['var(--chart-color-1)', 'var(--chart-color-2)', 'var(--chart-color-3)'];

/**
 * The mockup rounds the whole stacked column (4px), not each segment — so
 * only the bottom-most series gets bottom corners and only the top-most
 * gets top corners; a single-series stack gets all four.
 */
export function getStackedBarRadius(index: number, length: number): [number, number, number, number] | undefined {
  const isFirst = index === 0;
  const isLast = index === length - 1;
  if (isFirst && isLast) return [4, 4, 4, 4];
  if (isLast) return [4, 4, 0, 0];
  if (isFirst) return [0, 0, 4, 4];
  return undefined;
}

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
    <Surface
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
            {/*
              Gridlines, Y-axis ticks, card radius and legend position already
              matched the design as shipped (see README); this is the one piece
              that had zero styling of its own — recharts' bare defaults — so
              it's pulled onto the same token system as everything else instead
              of standing out as unstyled.
            */}
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-table)',
              }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
              itemStyle={{ color: 'var(--color-text-muted)' }}
            />
            <Legend
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: 'var(--font-size-table)', color: 'var(--color-text-muted)' }}
            />
            {series.map((s, index) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                stackId="clients"
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                radius={getStackedBarRadius(index, series.length)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Surface>
  );
}

import type { ClientNode } from '@nevis/shared';

/**
 * A node's children live under one of three differently-named keys
 * depending on its level (`branches` / `employees` / `channels`), and a
 * node may have none of them. This is the single place that knows that.
 *
 * Assumes a node never has more than one of the three keys populated at
 * once, which holds for the brief's dataset; if that ever changed, this
 * would silently prefer `branches`, then `employees`, then `channels`.
 */
export function getChildren(node: ClientNode): ClientNode[] | undefined {
  return node.branches ?? node.employees ?? node.channels;
}

export interface ChartSeries {
  /** The child's own name; used both as the Recharts dataKey and its legend label. */
  name: string;
  values: number[];
}

/**
 * Stacked-bar series for a node: one series per direct child (so a node
 * with children always renders as a real stack), or a single "Total"
 * series from the node's own `values` when it's a leaf. No proportions are
 * ever fabricated for levels that don't have a real breakdown.
 */
export function getChartSeries(node: ClientNode): ChartSeries[] {
  const children = getChildren(node);

  if (children && children.length > 0) {
    return children.map((child) => ({ name: child.name, values: child.values }));
  }

  return [{ name: 'Total', values: node.values }];
}

export interface ChartDatum {
  month: string;
  [seriesName: string]: string | number;
}

/** Shapes a node's chart series into Recharts' `data` prop, one row per month. */
export function toChartData(node: ClientNode, months: string[]): ChartDatum[] {
  const series = getChartSeries(node);

  return months.map((month, index) => {
    const datum: ChartDatum = { month };
    for (const s of series) {
      datum[s.name] = s.values[index] ?? 0;
    }
    return datum;
  });
}

export type ChildrenKind = 'branches' | 'employees' | 'channels';

/** Which key a node's children live under, for building human-readable labels. */
export function getChildrenKind(node: ClientNode): ChildrenKind | null {
  if (node.branches) return 'branches';
  if (node.employees) return 'employees';
  if (node.channels) return 'channels';
  return null;
}

export type NodeKind = 'company' | 'branch' | 'employee' | 'channel';

/**
 * The tree always has this fixed shape (Company → Branch → Employee →
 * Channel), so a row's depth deterministically maps to a node kind — no
 * separate `kind` field is needed on the data itself.
 */
export function getNodeKind(depth: number): NodeKind {
  if (depth === 0) return 'company';
  if (depth === 1) return 'branch';
  if (depth === 2) return 'employee';
  return 'channel';
}

export interface FlatRow {
  node: ClientNode;
  depth: number;
  hasChildren: boolean;
  parentId: string | null;
}

/**
 * Flattens the tree into the ordered list of rows currently visible in the
 * table, given which node ids are expanded. A node's children are only
 * visited if the node itself is in `expandedIds` — so a collapsed ancestor
 * hides its whole subtree regardless of any descendant's own expanded
 * state, and that descendant state naturally resumes if the ancestor is
 * expanded again (nothing is cleared on collapse).
 */
export function flattenVisibleRows(root: ClientNode, expandedIds: ReadonlySet<string>): FlatRow[] {
  const rows: FlatRow[] = [];

  const visit = (node: ClientNode, depth: number, parentId: string | null) => {
    const children = getChildren(node);
    const hasChildren = Boolean(children && children.length > 0);
    rows.push({ node, depth, hasChildren, parentId });

    if (hasChildren && expandedIds.has(node.id)) {
      for (const child of children ?? []) {
        visit(child, depth + 1, node.id);
      }
    }
  };

  visit(root, 0, null);
  return rows;
}

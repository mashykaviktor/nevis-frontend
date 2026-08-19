import type { ClientNode } from '@nevis/shared';

export type ChildrenKind = 'branches' | 'employees' | 'channels';

interface ChildrenInfo {
  kind: ChildrenKind;
  children: ClientNode[];
}

/**
 * A node's children live under one of three differently-named keys
 * depending on its level (`branches` / `employees` / `channels`), and a
 * node may have none of them. This is the single place that knows that —
 * `getChildren` and `getChildrenKind` both derive from it, so they can't
 * disagree with each other.
 *
 * A key only counts as "present" if it actually has entries: an empty
 * array is treated the same as an absent key, not as real (empty)
 * children — otherwise a node with e.g. `branches: []` and a populated
 * `employees` would have its real employees silently hidden.
 *
 * Assumes a node never has more than one of the three keys non-empty at
 * once, which holds for the brief's dataset; if that ever changed, this
 * would silently prefer `branches`, then `employees`, then `channels`.
 */
function resolveChildren(node: ClientNode): ChildrenInfo | null {
  if (node.branches?.length) return { kind: 'branches', children: node.branches };
  if (node.employees?.length) return { kind: 'employees', children: node.employees };
  if (node.channels?.length) return { kind: 'channels', children: node.channels };
  return null;
}

export function getChildren(node: ClientNode): ClientNode[] | undefined {
  return resolveChildren(node)?.children;
}

/** Which key a node's children live under, for building human-readable labels. */
export function getChildrenKind(node: ClientNode): ChildrenKind | null {
  return resolveChildren(node)?.kind ?? null;
}

export interface ChartSeries {
  /** The child's own id — guaranteed unique among siblings, unlike `name`. */
  key: string;
  /** The child's own name; used as the Recharts series/legend label. */
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
    return children.map((child) => ({ key: child.id, name: child.name, values: child.values }));
  }

  return [{ key: 'total', name: 'Total', values: node.values }];
}

export interface ChartDatum {
  month: string;
  [seriesKey: string]: string | number;
}

/** Shapes a node's chart series into Recharts' `data` prop, one row per month. */
export function toChartData(node: ClientNode, months: string[]): ChartDatum[] {
  const series = getChartSeries(node);

  return months.map((month, index) => {
    const datum: ChartDatum = { month };
    for (const s of series) {
      datum[s.key] = s.values[index] ?? 0;
    }
    return datum;
  });
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

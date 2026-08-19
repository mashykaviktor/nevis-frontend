import { describe, expect, it } from 'vitest';
import type { ClientNode } from '@nevis/shared';
import { flattenVisibleRows, getChartSeries, getChildren, getChildrenKind, getNodeKind, toChartData } from './tree';

const months = ['Jan', 'Feb'];

const existingClients: ClientNode = { id: 'existing', name: 'Existing clients', values: [3, 6] };
const newOrganic: ClientNode = { id: 'new-organic', name: 'New organic', values: [1, 2] };

const anna: ClientNode = {
  id: 'anna',
  name: 'Anna',
  values: [4, 8],
  channels: [existingClients, newOrganic],
};

const james: ClientNode = { id: 'james', name: 'James', values: [3, 7] };

const branch1: ClientNode = {
  id: 'branch1',
  name: 'Branch 1',
  values: [7, 15],
  employees: [anna, james],
};

const branch2: ClientNode = { id: 'branch2', name: 'Branch 2', values: [3, 5] };

const company: ClientNode = {
  id: 'company',
  name: 'Company',
  values: [10, 20],
  branches: [branch1, branch2],
};

describe('getChildren', () => {
  it('resolves branches, employees, or channels depending on the node', () => {
    expect(getChildren(company)).toEqual([branch1, branch2]);
    expect(getChildren(branch1)).toEqual([anna, james]);
    expect(getChildren(anna)).toEqual([existingClients, newOrganic]);
  });

  it('returns undefined for a leaf node', () => {
    expect(getChildren(branch2)).toBeUndefined();
    expect(getChildren(james)).toBeUndefined();
    expect(getChildren(existingClients)).toBeUndefined();
  });
});

describe('getChartSeries', () => {
  it('returns one series per direct child, using the children own values', () => {
    expect(getChartSeries(company)).toEqual([
      { name: 'Branch 1', values: [7, 15] },
      { name: 'Branch 2', values: [3, 5] },
    ]);
  });

  it('returns channel series for a node that has channels', () => {
    expect(getChartSeries(anna)).toEqual([
      { name: 'Existing clients', values: [3, 6] },
      { name: 'New organic', values: [1, 2] },
    ]);
  });

  it('falls back to a single "Total" series for a leaf, without fabricating a breakdown', () => {
    expect(getChartSeries(branch2)).toEqual([{ name: 'Total', values: [3, 5] }]);
    expect(getChartSeries(james)).toEqual([{ name: 'Total', values: [3, 7] }]);
  });
});

describe('toChartData', () => {
  it('maps a multi-series node into one row per month', () => {
    expect(toChartData(company, months)).toEqual([
      { month: 'Jan', 'Branch 1': 7, 'Branch 2': 3 },
      { month: 'Feb', 'Branch 1': 15, 'Branch 2': 5 },
    ]);
  });

  it('maps a leaf node into a single "Total" column', () => {
    expect(toChartData(branch2, months)).toEqual([
      { month: 'Jan', Total: 3 },
      { month: 'Feb', Total: 5 },
    ]);
  });
});

describe('flattenVisibleRows', () => {
  it('shows only the root when nothing is expanded', () => {
    const rows = flattenVisibleRows(company, new Set());

    expect(rows).toEqual([{ node: company, depth: 0, hasChildren: true, parentId: null }]);
  });

  it('reveals direct children when the root is expanded, including a childless leaf', () => {
    const rows = flattenVisibleRows(company, new Set(['company']));

    expect(rows).toEqual([
      { node: company, depth: 0, hasChildren: true, parentId: null },
      { node: branch1, depth: 1, hasChildren: true, parentId: 'company' },
      { node: branch2, depth: 1, hasChildren: false, parentId: 'company' },
    ]);
  });

  it('reveals grandchildren, including a mix of expandable and leaf employees', () => {
    const rows = flattenVisibleRows(company, new Set(['company', 'branch1']));

    expect(rows).toEqual([
      { node: company, depth: 0, hasChildren: true, parentId: null },
      { node: branch1, depth: 1, hasChildren: true, parentId: 'company' },
      { node: anna, depth: 2, hasChildren: true, parentId: 'branch1' },
      { node: james, depth: 2, hasChildren: false, parentId: 'branch1' },
      { node: branch2, depth: 1, hasChildren: false, parentId: 'company' },
    ]);
  });

  it('reveals the deepest level (channels) when every ancestor is expanded', () => {
    const rows = flattenVisibleRows(company, new Set(['company', 'branch1', 'anna']));

    expect(rows.map((r) => r.node.id)).toEqual([
      'company',
      'branch1',
      'anna',
      'existing',
      'new-organic',
      'james',
      'branch2',
    ]);
  });

  it('hides a subtree entirely when its ancestor is collapsed, even if the descendant id is still "expanded"', () => {
    // branch1 and anna are marked expanded, but company itself is not — nothing
    // below the root should render. This is the pure-function half of decision 14
    // (expand state is never cleared on collapse, so it silently resumes later).
    const rows = flattenVisibleRows(company, new Set(['branch1', 'anna']));

    expect(rows).toEqual([{ node: company, depth: 0, hasChildren: true, parentId: null }]);
  });

  it('resumes a previously-expanded descendant once its ancestor is expanded again', () => {
    const rows = flattenVisibleRows(company, new Set(['company', 'branch1', 'anna']));

    expect(rows.map((r) => r.node.id)).toContain('existing');
  });
});

describe('getChildrenKind', () => {
  it('names the key a node children live under', () => {
    expect(getChildrenKind(company)).toBe('branches');
    expect(getChildrenKind(branch1)).toBe('employees');
    expect(getChildrenKind(anna)).toBe('channels');
  });

  it('returns null for a leaf', () => {
    expect(getChildrenKind(branch2)).toBeNull();
    expect(getChildrenKind(james)).toBeNull();
  });
});

describe('getNodeKind', () => {
  it('maps depth to the fixed Company/Branch/Employee/Channel schema', () => {
    expect(getNodeKind(0)).toBe('company');
    expect(getNodeKind(1)).toBe('branch');
    expect(getNodeKind(2)).toBe('employee');
    expect(getNodeKind(3)).toBe('channel');
  });
});

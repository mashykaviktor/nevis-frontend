import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ClientNode } from '@nevis/shared';
import { useExpandedRows } from '../../hooks/useExpandedRows';
import { flattenVisibleRows } from '../../lib/tree';
import { sampleCompany, sampleMonths } from '../../test/fixtures';
import { ClientsTable } from './ClientsTable';

/**
 * Mirrors how Dashboard wires the table up (hook + flatten + controlled
 * table), so these tests exercise the real expand/collapse behavior rather
 * than a fake harness.
 */
function TableHarness() {
  const { expandedIds, toggle } = useExpandedRows([sampleCompany.id]);
  const rows = flattenVisibleRows(sampleCompany, expandedIds);

  return (
    <ClientsTable
      rows={rows}
      months={sampleMonths}
      expandedIds={expandedIds}
      onToggle={(row) => toggle(row.node.id)}
    />
  );
}

describe('ClientsTable', () => {
  it('shows the root and its direct children by default, hiding deeper levels', () => {
    render(<TableHarness />);

    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Branch 1')).toBeInTheDocument();
    expect(screen.getByText('Branch 2')).toBeInTheDocument();
    expect(screen.queryByText('Anna Blackwood')).not.toBeInTheDocument();
  });

  it('renders row names as row headers, so a value cell reads with its row name', () => {
    render(<TableHarness />);

    expect(screen.getByRole('rowheader', { name: 'Branch 1' })).toBeInTheDocument();
  });

  it('does not render a toggle for a row with no children', () => {
    render(<TableHarness />);

    const branch2Row = screen.getByRole('rowheader', { name: 'Branch 2' }).closest('tr');
    expect(branch2Row).not.toBeNull();
    expect(within(branch2Row as HTMLElement).queryByRole('button')).not.toBeInTheDocument();
  });

  it('gives the toggle an accessible name with level and child-count context', () => {
    render(<TableHarness />);

    expect(
      screen.getByRole('button', { name: 'Expand Branch 1, level 2, 2 employees' }),
    ).toBeInTheDocument();
  });

  it('expands a row on click, revealing its children and updating aria-expanded on both the button and the row', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);

    const toggle = screen.getByRole('button', { name: /expand branch 1/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.closest('tr')).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.closest('tr')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Anna Blackwood')).toBeInTheDocument();
    expect(screen.getByText('James Walker')).toBeInTheDocument();
  });

  it('collapses a row on a second click, removing its children from the DOM entirely', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);

    await user.click(screen.getByRole('button', { name: /expand branch 1/i }));
    expect(screen.getByText('Anna Blackwood')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /collapse branch 1/i }));

    expect(screen.queryByText('Anna Blackwood')).not.toBeInTheDocument();
    expect(screen.queryByText('James Walker')).not.toBeInTheDocument();
  });

  it('toggles via the keyboard (Enter), since it is a native button', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);

    const toggle = screen.getByRole('button', { name: /expand branch 1/i });
    toggle.focus();
    await user.keyboard('{Enter}');

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Anna Blackwood')).toBeInTheDocument();
  });

  it('toggles via the keyboard (Space), since it is a native button', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);

    const toggle = screen.getByRole('button', { name: /expand branch 1/i });
    toggle.focus();
    await user.keyboard(' ');

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Anna Blackwood')).toBeInTheDocument();
  });

  it('singularizes the child-count word in the toggle label for a count of exactly one', () => {
    const onlyChild: ClientNode = { id: 'only-child', name: 'Only Employee', values: [1, 1] };
    const oneChildBranch: ClientNode = {
      id: 'one-child-branch',
      name: 'Solo Branch',
      values: [1, 1],
      employees: [onlyChild],
    };
    const rows = flattenVisibleRows(oneChildBranch, new Set());

    render(<ClientsTable rows={rows} months={sampleMonths} expandedIds={new Set()} onToggle={() => {}} />);

    expect(
      screen.getByRole('button', { name: 'Expand Solo Branch, level 1, 1 employee' }),
    ).toBeInTheDocument();
  });

  it('reveals the deepest level (channels) once every ancestor is expanded', async () => {
    const user = userEvent.setup();
    render(<TableHarness />);

    await user.click(screen.getByRole('button', { name: /expand branch 1/i }));
    await user.click(screen.getByRole('button', { name: /expand anna blackwood/i }));

    expect(screen.getByText('Existing clients')).toBeInTheDocument();
    expect(screen.getByText('New organic')).toBeInTheDocument();
  });
});

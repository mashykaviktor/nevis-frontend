import { cloneElement, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { sampleCompany, sampleMonths } from '../../test/fixtures';
import { ClientsChart } from './ClientsChart';

// jsdom has no ResizeObserver / layout, so Recharts' ResponsiveContainer
// measures 0x0 and renders nothing. Replacing it with a fixed-size pass-
// through lets the actual <BarChart> render real SVG we can assert on.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement<{ width?: number; height?: number }> }) =>
      cloneElement(children, { width: 800, height: 400 }),
  };
});

describe('ClientsChart', () => {
  it('renders one stacked bar series per direct child of the given node', () => {
    const { container } = render(<ClientsChart node={sampleCompany} months={sampleMonths} />);

    // sampleCompany has two branches, so the chart should stack two series.
    expect(container.querySelectorAll('.recharts-bar')).toHaveLength(2);
  });

  it('names each series after the child, visible via the legend', () => {
    render(<ClientsChart node={sampleCompany} months={sampleMonths} />);

    expect(screen.getByText('Branch 1')).toBeInTheDocument();
    expect(screen.getByText('Branch 2')).toBeInTheDocument();
  });

  it('falls back to a single "Total" series for a leaf node, without fabricating a breakdown', () => {
    const leaf = sampleCompany.branches?.[1];
    if (!leaf) throw new Error('fixture missing a leaf branch');

    const { container } = render(<ClientsChart node={leaf} months={sampleMonths} />);

    expect(container.querySelectorAll('.recharts-bar')).toHaveLength(1);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('exposes an accessible name describing the node and its series, for the SVG that is otherwise opaque to assistive tech', () => {
    render(<ClientsChart node={sampleCompany} months={sampleMonths} />);

    const region = screen.getByRole('img');
    expect(region.getAttribute('aria-label')).toContain('Company');
    expect(region.getAttribute('aria-label')).toContain('Branch 1');
    expect(region.getAttribute('aria-label')).toContain('Branch 2');
  });
});

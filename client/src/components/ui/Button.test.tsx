import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Retry</Button>);

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        Retry
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type="button" so it never submits an enclosing form', () => {
    render(<Button>Retry</Button>);

    expect(screen.getByRole('button', { name: 'Retry' })).toHaveAttribute('type', 'button');
  });

  it('is reachable by keyboard and focusable', async () => {
    const user = userEvent.setup();
    render(<Button>Retry</Button>);

    await user.tab();

    expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus();
  });
});

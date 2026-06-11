import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Popconfirm } from './Popconfirm';

describe('Popconfirm', () => {
  it('opens from the trigger, confirms, and closes', async () => {
    const onConfirm = vi.fn();
    render(
      <Popconfirm trigger={<button>Delete</button>} onConfirm={onConfirm}>
        Are you sure?
      </Popconfirm>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Are you sure?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
  it('cancel fires onCancel and closes without confirming', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <Popconfirm trigger={<button>Del</button>} onConfirm={onConfirm} onCancel={onCancel}>
        Sure?
      </Popconfirm>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Del' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('moves focus into the dialog on open and restores it to the trigger on close', async () => {
    render(
      <Popconfirm trigger={<button>Delete</button>} onConfirm={() => {}}>
        Are you sure?
      </Popconfirm>,
    );
    const trigger = screen.getByRole('button', { name: 'Delete' });
    await userEvent.click(trigger);
    // Focus moves to the first actionable control inside the role="dialog" panel.
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    // Confirming closes the panel and returns focus to the opener.
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(trigger).toHaveFocus();
  });

  it('traps Tab within the dialog', async () => {
    render(
      <Popconfirm trigger={<button>Delete</button>} onConfirm={() => {}}>
        Are you sure?
      </Popconfirm>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(cancel).toHaveFocus();
    await userEvent.tab();
    expect(confirm).toHaveFocus();
    // Tab past the last control wraps back to the first.
    await userEvent.tab();
    expect(cancel).toHaveFocus();
  });
});

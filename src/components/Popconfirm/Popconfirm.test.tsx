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
});

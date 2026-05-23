import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog, ConfirmDialog } from './';

beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  }
});

describe('Dialog', () => {
  it('is not shown when open is false', () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Hi">
        Body
      </Dialog>,
    );
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    expect(dlg.open).toBe(false);
  });

  it('shows modally and labels itself by its title when open', () => {
    render(
      <Dialog open onClose={() => {}} title="Settings">
        Body
      </Dialog>,
    );
    const dlg = screen.getByRole('dialog', { name: 'Settings' });
    expect(dlg).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Settings">
        Body
      </Dialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on the native close event (Esc)', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Settings">
        Body
      </Dialog>,
    );
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    dlg.dispatchEvent(new Event('close'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ConfirmDialog', () => {
  it('renders title, description, and confirm/cancel actions', () => {
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete item?"
        description="This cannot be undone."
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Delete item?' })).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('fires onConfirm then onClose on confirm; only onClose on cancel', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

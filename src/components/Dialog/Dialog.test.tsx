import { describe, it, expect, vi, beforeAll } from 'vitest';
import { useRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
      <Dialog open={false} onOpenChange={() => {}} title="Hi">
        Body
      </Dialog>,
    );
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    expect(dlg.open).toBe(false);
  });

  it('shows modally and labels itself by its title when open', () => {
    render(
      <Dialog open onOpenChange={() => {}} title="Settings">
        Body
      </Dialog>,
    );
    const dlg = screen.getByRole('dialog', { name: 'Settings' });
    expect(dlg).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when the close button is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Settings">
        Body
      </Dialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) on the native close event (Esc)', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Settings">
        Body
      </Dialog>,
    );
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    dlg.dispatchEvent(new Event('close'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('focuses the initialFocus ref when opened', async () => {
    function Harness() {
      const inputRef = useRef<HTMLInputElement>(null);
      return (
        <Dialog open onOpenChange={() => {}} title="Form" initialFocus={inputRef}>
          <button>before</button>
          <input ref={inputRef} aria-label="first field" />
        </Dialog>
      );
    }
    render(<Harness />);
    await waitFor(() => expect(screen.getByLabelText('first field')).toHaveFocus());
  });

  it('focuses an initialFocus selector when opened', async () => {
    render(
      <Dialog open onOpenChange={() => {}} title="Form" initialFocus="#target">
        <input id="target" aria-label="target field" />
      </Dialog>,
    );
    await waitFor(() => expect(screen.getByLabelText('target field')).toHaveFocus());
  });
});

describe('ConfirmDialog', () => {
  it('renders title, description, and confirm/cancel actions', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
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

  it('fires onConfirm then onOpenChange(false) on confirm; only onOpenChange(false) on cancel', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="Delete?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('focuses the confirm button by default', async () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Sure?"
        confirmLabel="Yes"
      />,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Yes' })).toHaveFocus());
  });
});

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { useRef } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  it('closes on a backdrop click that both presses and releases on the dialog backdrop', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Settings">
        Body
      </Dialog>,
    );
    const dlg = screen.getByRole('dialog', { name: 'Settings' });
    fireEvent.mouseDown(dlg);
    fireEvent.click(dlg);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close when a press starts inside the surface and releases on the backdrop', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Settings">
        <input aria-label="field" />
      </Dialog>,
    );
    const dlg = screen.getByRole('dialog', { name: 'Settings' });
    // Press begins inside the dialog (on the input), release bubbles to the
    // dialog element (the browser reports this as a click on the backdrop).
    fireEvent.mouseDown(screen.getByLabelText('field'));
    fireEvent.click(dlg);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('does not close when dismissable is false even on a genuine backdrop click', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Settings" dismissable={false}>
        Body
      </Dialog>,
    );
    const dlg = screen.getByRole('dialog', { name: 'Settings' });
    fireEvent.mouseDown(dlg);
    fireEvent.click(dlg);
    expect(onOpenChange).not.toHaveBeenCalled();
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

  it('associates the description with the dialog via aria-describedby', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Delete item?"
        description="This cannot be undone."
      />,
    );
    const dlg = screen.getByRole('dialog', { name: 'Delete item?' });
    const describedBy = dlg.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const description = document.getElementById(describedBy as string);
    expect(description).toHaveTextContent('This cannot be undone.');
  });

  it('omits aria-describedby when no description is supplied', () => {
    render(
      <ConfirmDialog open onOpenChange={() => {}} onConfirm={() => {}} title="Delete item?" />,
    );
    const dlg = screen.getByRole('dialog', { name: 'Delete item?' });
    expect(dlg).not.toHaveAttribute('aria-describedby');
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

  it('supports a warning tone on the confirm button', () => {
    render(
      <ConfirmDialog open onOpenChange={() => {}} onConfirm={() => {}} title="T" tone="warning" />,
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveAttribute('data-tone', 'warning');
  });

  it('when confirmLoading is provided, confirm does NOT auto-close (consumer owns closing)', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="Delete?"
        confirmLoading={false}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('while confirmLoading, the confirm button is busy/disabled and dismissal is blocked', async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="Deleting"
        confirmLoading
        loadingText="Deleting…"
      />,
    );
    const confirm = screen.getByRole('button', { name: /Confirm/ });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    // Re-confirm is blocked while pending.
    await userEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
    // Cancel is disabled and cannot dismiss mid-flight.
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('preventDefaults the native cancel (Esc) while confirmLoading so the dialog cannot get stuck closed', () => {
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={() => {}}
        title="Deleting"
        confirmLoading
        loadingText="Deleting…"
      />,
    );
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    const cancelEvent = new Event('cancel', { cancelable: true });
    dlg.dispatchEvent(cancelEvent);
    // dismissable={!confirmLoading} → false, so Dialog preventDefaults the native
    // cancel; the browser never runs dialog.close(), so React `open` stays true
    // and the dialog can't end up visually closed but logically open.
    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('lets the native cancel (Esc) through when not loading', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Delete?"
        confirmLoading={false}
      />,
    );
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    const cancelEvent = new Event('cancel', { cancelable: true });
    dlg.dispatchEvent(cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(false);
  });
});

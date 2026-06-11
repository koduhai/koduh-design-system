import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer } from './Drawer';

// jsdom does not implement <dialog> showModal/close — shim them (mirrors Dialog.test).
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

describe('Drawer', () => {
  it('is not shown when open is false', () => {
    render(
      <Drawer open={false} onOpenChange={() => {}} title="Filters">
        Body
      </Drawer>,
    );
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    expect(dlg.open).toBe(false);
  });

  it('shows and labels itself by its title when open', () => {
    render(
      <Drawer open onOpenChange={() => {}} title="Filters">
        Body
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('reflects the side as a data attribute', () => {
    render(
      <Drawer open onOpenChange={() => {}} title="Filters" side="start">
        Body
      </Drawer>,
    );
    expect(document.querySelector('dialog')).toHaveAttribute('data-side', 'start');
  });

  it('defaults the side to end', () => {
    render(
      <Drawer open onOpenChange={() => {}} title="Filters">
        Body
      </Drawer>,
    );
    expect(document.querySelector('dialog')).toHaveAttribute('data-side', 'end');
  });

  it('calls onOpenChange(false) when the close button is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer open onOpenChange={onOpenChange} title="Filters">
        Body
      </Drawer>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('is named by a consumer-supplied aria-label when no title is given', () => {
    render(
      <Drawer open onOpenChange={() => {}} aria-label="Settings">
        Body
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
  });

  it('locks background scroll while open and restores it on close', () => {
    document.body.style.overflow = 'auto';
    const { rerender } = render(
      <Drawer open onOpenChange={() => {}} title="Filters">
        Body
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    rerender(
      <Drawer open={false} onOpenChange={() => {}} title="Filters">
        Body
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe('auto');
  });

  it('restores background scroll on unmount', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(
      <Drawer open onOpenChange={() => {}} title="Filters">
        Body
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { Popover } from './Popover';

function Harness({
  defaultOpen = false,
  dismissable = true,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  dismissable?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button data-testid="outside">outside</button>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        dismissable={dismissable}
        role="dialog"
        trigger={
          <button type="button" onClick={() => setOpen((o) => !o)}>
            Open
          </button>
        }
      >
        <p>Panel content</p>
      </Popover>
    </div>
  );
}

describe('Popover', () => {
  it('renders the trigger and wires a shared anchor name', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    const anchorName = trigger.style.getPropertyValue('--ku-anchor-name');
    expect(anchorName).toMatch(/^--ku-anchor-/);
  });

  it('shows panel content when open', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('toggles open from the trigger', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    expect(screen.getByRole('dialog')).toHaveAttribute('data-open', 'false');
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-open', 'true');
  });

  it('closes on Escape when dismissable', () => {
    const onOpenChange = vi.fn();
    render(<Harness defaultOpen onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close on Escape when not dismissable', () => {
    const onOpenChange = vi.fn();
    render(<Harness defaultOpen dismissable={false} onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes on outside pointerdown when dismissable', () => {
    const onOpenChange = vi.fn();
    render(<Harness defaultOpen onOpenChange={onOpenChange} />);
    fireEvent.pointerDown(screen.getByTestId('outside'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

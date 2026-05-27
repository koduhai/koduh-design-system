import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders a non-interactive chip as a span with the label', () => {
    render(<Chip label="Tag" />);
    const el = screen.getByText('Tag');
    expect(el.closest('span')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('accepts a ReactNode label and renders it', () => {
    render(
      <Chip
        label={
          <span>
            <span aria-hidden>▲</span> +12.5%
          </span>
        }
      />,
    );
    expect(screen.getByText('+12.5%', { exact: false })).toBeInTheDocument();
  });

  it('falls back to "Remove" for the delete label when label is not a string', () => {
    render(<Chip label={<span>x</span>} onDelete={() => {}} />);
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('renders a button and fires onClick when clickable', async () => {
    const onClick = vi.fn();
    render(<Chip label="Filter" onClick={onClick} />);
    const btn = screen.getByRole('button', { name: 'Filter' });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a labelled delete button that fires onDelete (and not onClick)', async () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();
    render(<Chip label="Apple" onClick={onClick} onDelete={onDelete} />);
    const del = screen.getByRole('button', { name: 'Remove Apple' });
    await userEvent.click(del);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is keyboard-operable when both onClick and onDelete are set', async () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();
    render(<Chip label="Apple" onClick={onClick} onDelete={onDelete} />);

    // The main click target is a focusable, operable region (role/tabindex),
    // separate from the delete button (no nested buttons). The root <span> is
    // the click target; the delete <button> is its own button element.
    const target = screen.getByText('Apple').closest('[data-variant]')!;
    expect(target.tagName).toBe('SPAN');
    expect(target).toHaveAttribute('role', 'button');
    expect(target).toHaveAttribute('tabindex', '0');

    (target as HTMLElement).focus();
    expect(target).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onDelete).not.toHaveBeenCalled();

    // The delete button fires onDelete independently, without triggering onClick.
    const del = screen.getByRole('button', { name: 'Remove Apple' });
    await userEvent.click(del);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('reflects variant/tone/size as data attributes', () => {
    render(<Chip label="X" variant="outline" tone="danger" size="sm" />);
    const el = screen.getByText('X').closest('[data-variant]')!;
    expect(el).toHaveAttribute('data-variant', 'outline');
    expect(el).toHaveAttribute('data-tone', 'danger');
    expect(el).toHaveAttribute('data-size', 'sm');
  });

  it.each(['success', 'warning', 'info', 'accent'] as const)('supports the %s tone', (tone) => {
    render(<Chip label="X" tone={tone} />);
    expect(screen.getByText('X').closest('[data-tone]')).toHaveAttribute('data-tone', tone);
  });
});

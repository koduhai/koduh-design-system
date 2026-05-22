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

  it('reflects variant/tone/size as data attributes', () => {
    render(<Chip label="X" variant="outline" tone="danger" size="sm" />);
    const el = screen.getByText('X').closest('[data-variant]')!;
    expect(el).toHaveAttribute('data-variant', 'outline');
    expect(el).toHaveAttribute('data-tone', 'danger');
    expect(el).toHaveAttribute('data-size', 'sm');
  });
});

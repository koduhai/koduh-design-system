import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleGroup } from './ToggleGroup';

const ITEMS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board', disabled: true },
];

describe('ToggleGroup', () => {
  it('single: exposes a radiogroup of radios', () => {
    render(<ToggleGroup type="single" items={ITEMS} defaultValue="list" />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true');
  });

  it('single: clicking an item selects it and fires onChange with the value', async () => {
    const onChange = vi.fn();
    render(<ToggleGroup type="single" items={ITEMS} defaultValue="list" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Grid' }));
    expect(onChange).toHaveBeenCalledWith('grid');
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
  });

  it('multiple: toggles membership and fires onChange with an array', async () => {
    const onChange = vi.fn();
    render(
      <ToggleGroup type="multiple" items={ITEMS} defaultValue={['list']} onChange={onChange} />,
    );
    const grid = screen.getByRole('button', { name: 'Grid' });
    expect(screen.getByRole('group')).toBeInTheDocument();
    await userEvent.click(grid);
    expect(onChange).toHaveBeenLastCalledWith(['list', 'grid']);
    expect(grid).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(grid);
    expect(onChange).toHaveBeenLastCalledWith(['list']);
  });

  it('does not select a disabled item', async () => {
    const onChange = vi.fn();
    render(<ToggleGroup type="single" items={ITEMS} defaultValue="list" onChange={onChange} />);
    const board = screen.getByRole('radio', { name: 'Board' });
    expect(board).toBeDisabled();
    await userEvent.click(board);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('roving focus: arrow key moves to and selects the next enabled item (single)', async () => {
    render(<ToggleGroup type="single" items={ITEMS} defaultValue="list" />);
    const list = screen.getByRole('radio', { name: 'List' });
    list.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
  });
});

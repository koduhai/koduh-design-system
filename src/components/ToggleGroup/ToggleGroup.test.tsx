import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleGroup } from './ToggleGroup';
import { FormField } from '../FormField';

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

  describe('FormField composition (#35)', () => {
    it('takes its accessible name from the FormField label', () => {
      render(
        <FormField label="View mode">
          <ToggleGroup type="single" items={ITEMS} defaultValue="list" />
        </FormField>,
      );
      // The radiogroup is named by the field's label via aria-labelledby.
      expect(screen.getByRole('radiogroup', { name: 'View mode' })).toBeInTheDocument();
    });

    it('reflects the field error and description wiring', () => {
      render(
        <FormField label="View mode" error errorText="Pick one">
          <ToggleGroup type="single" items={ITEMS} defaultValue="list" />
        </FormField>,
      );
      const group = screen.getByRole('radiogroup', { name: 'View mode' });
      expect(group).toHaveAttribute('aria-invalid', 'true');
      expect(group).toHaveAccessibleDescription('Pick one');
    });

    it('lets an explicit aria-label override the field label', () => {
      render(
        <FormField label="View mode">
          <ToggleGroup type="single" aria-label="Layout" items={ITEMS} defaultValue="list" />
        </FormField>,
      );
      expect(screen.getByRole('radiogroup', { name: 'Layout' })).toBeInTheDocument();
    });
  });
});

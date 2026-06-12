import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleGroup } from './ToggleGroup';
import { FormField } from '../FormField';
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';
import { useFormField } from '../Form/useFormField';

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

  it('single: roving tabIndex follows an externally-driven controlled value change', () => {
    const { rerender } = render(<ToggleGroup type="single" items={ITEMS} value="list" />);
    // 'list' starts tabbable, 'grid' is not.
    expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('tabindex', '-1');
    // Parent drives a new selection without any click/keydown in the group.
    rerender(<ToggleGroup type="single" items={ITEMS} value="grid" />);
    // The checked option must be the tabbable one per the radiogroup pattern.
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('tabindex', '-1');
  });

  it('multiple mode does not emit aria-required on the role=group element', () => {
    render(
      <FormField label="View mode" required>
        <ToggleGroup type="multiple" items={ITEMS} defaultValue={['list']} />
      </FormField>,
    );
    const group = screen.getByRole('group', { name: 'View mode' });
    expect(group).not.toHaveAttribute('aria-required');
  });

  it('single mode emits aria-required on the role=radiogroup element', () => {
    render(
      <FormField label="View mode" required>
        <ToggleGroup type="single" items={ITEMS} defaultValue="list" />
      </FormField>,
    );
    const group = screen.getByRole('radiogroup', { name: 'View mode' });
    expect(group).toHaveAttribute('aria-required', 'true');
  });

  describe('ToggleGroup bound to a Form', () => {
    it('single: reads value from the form and writes selection back', async () => {
      function Probe() {
        const f = useFormField('field');
        return <span data-testid="v">{JSON.stringify(f.value ?? null)}</span>;
      }
      function Wrap() {
        const form = useForm({ defaultValues: { field: 'list' } });
        return (
          <Form form={form} aria-label="f">
            <FormField name="field" label="View">
              <ToggleGroup type="single" items={ITEMS} />
            </FormField>
            <Probe />
          </Form>
        );
      }
      render(<Wrap />);
      // bound default: 'list' item is checked
      expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true');
      // click Grid
      await userEvent.click(screen.getByRole('radio', { name: 'Grid' }));
      // form value updated
      expect(screen.getByTestId('v')).toHaveTextContent('"grid"');
    });

    it('multiple: reads value from the form and writes selection back', async () => {
      function Probe() {
        const f = useFormField('field');
        return <span data-testid="v">{JSON.stringify(f.value ?? null)}</span>;
      }
      function Wrap() {
        const form = useForm({ defaultValues: { field: ['list'] } });
        return (
          <Form form={form} aria-label="f">
            <FormField name="field" label="View">
              <ToggleGroup type="multiple" items={ITEMS} />
            </FormField>
            <Probe />
          </Form>
        );
      }
      render(<Wrap />);
      // bound default: 'list' item is pressed
      expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
      // click Grid to add it
      await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
      // form value updated
      expect(screen.getByTestId('v')).toHaveTextContent('["list","grid"]');
    });
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

import { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox } from './Combobox';
import { FormField } from '../FormField';
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';
import { useFormField } from '../Form/useFormField';

const opts = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
];

const options = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
];

describe('Combobox', () => {
  it('renders a combobox input with the visible label', () => {
    render(<Combobox label="Country" options={options} />);
    const input = screen.getByRole('combobox', { name: 'Country' });
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters options as you type and selects on click', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Country" options={options} onChange={onChange} />);
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'united');
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    expect(screen.queryByText('Canada')).toBeNull();
    await userEvent.click(screen.getByText('United Kingdom'));
    expect(onChange).toHaveBeenLastCalledWith('uk', expect.anything());
    expect(input).toHaveValue('United Kingdom');
  });

  it('keyboard: ArrowDown + Enter selects the active option', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Country" options={options} onChange={onChange} />);
    const input = screen.getByRole('combobox');
    input.focus();
    await userEvent.type(input, 'ca');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('ca', expect.anything());
  });

  it('keyboard: ArrowUp opens the listbox and lands on the last option', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Country" options={options} onChange={onChange} />);
    const input = screen.getByRole('combobox');
    input.focus();
    // Closed -> ArrowUp opens and highlights the last option (Canada).
    await userEvent.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('ca', expect.anything());
  });

  it('keyboard: Escape resets the highlight so reopen starts fresh', async () => {
    const onChange = vi.fn();
    render(<Combobox label="Country" options={options} onChange={onChange} />);
    const input = screen.getByRole('combobox');
    input.focus();
    // Open and move the highlight onto the last option.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant');
    // Escape closes the listbox.
    await userEvent.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    // Reopening with ArrowDown starts at the first option, not the stale last one.
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('us', expect.anything());
  });

  it('shows noResultsText when nothing matches', async () => {
    render(<Combobox label="Country" options={options} noResultsText="None" />);
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('wires required + error aria', () => {
    render(<Combobox label="Country" options={options} required error errorText="Pick one" />);
    const input = screen.getByRole('combobox', { name: /Country/ });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('inside FormField: combobox input id + aria from context, single label', () => {
    render(
      <FormField label="Country" required error errorText="Required" id="cty">
        <Combobox options={opts} />
      </FormField>,
    );
    const input = screen.getByRole('combobox');
    expect(input.id).toBe('cty');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText('Country')).toHaveLength(1);
  });

  it('forwards onBlur/name to the input (open interface)', async () => {
    const onBlur = vi.fn();
    render(<Combobox label="C" options={opts} name="country" onBlur={onBlur} />);
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('name', 'country');
    input.focus();
    input.blur();
    expect(onBlur).toHaveBeenCalled();
  });

  it('clearable: shows a clear button that resets the value', async () => {
    const onChange = vi.fn();
    render(<Combobox label="C" options={opts} clearable defaultValue="us" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onChange).toHaveBeenLastCalledWith('', expect.anything());
  });

  it('resolves the selected label when options arrive async after the value', () => {
    function Wrap() {
      const [opts2, setOpts2] = useState<typeof options>([]);
      return (
        <>
          <Combobox label="Country" options={opts2} value="ca" />
          <button type="button" onClick={() => setOpts2(options)}>
            load
          </button>
        </>
      );
    }
    render(<Wrap />);
    const input = screen.getByRole('combobox');
    // No options yet: the value's label cannot resolve, so the input is empty.
    expect(input).toHaveValue('');
    // Options arrive after the value was already set.
    act(() => {
      screen.getByRole('button', { name: 'load' }).click();
    });
    expect(input).toHaveValue('Canada');
  });

  describe('Combobox bound to a Form', () => {
    it('reads value from the form and writes selections back', async () => {
      function Probe() {
        const f = useFormField('field');
        return <span data-testid="v">{JSON.stringify(f.value ?? null)}</span>;
      }
      function Wrap() {
        const form = useForm({ defaultValues: { field: 'us' } });
        return (
          <Form form={form} aria-label="f">
            <FormField name="field" label="L">
              <Combobox options={opts} />
            </FormField>
            <Probe />
          </Form>
        );
      }
      render(<Wrap />);
      // bound default: input shows 'United States'
      expect(screen.getByRole('combobox')).toHaveValue('United States');
      // click the United Kingdom option
      const input = screen.getByRole('combobox');
      await userEvent.clear(input);
      await userEvent.type(input, 'united');
      await userEvent.click(screen.getByText('United Kingdom'));
      // form value updated
      expect(screen.getByTestId('v')).toHaveTextContent('"uk"');
    });

    it('re-syncs the visible query text on form reset()', async () => {
      let api!: ReturnType<typeof useForm>;
      function Wrap() {
        api = useForm({ defaultValues: { field: 'us' } });
        return (
          <Form form={api} aria-label="f">
            <FormField name="field" label="L">
              <Combobox options={opts} />
            </FormField>
          </Form>
        );
      }
      render(<Wrap />);
      const input = screen.getByRole('combobox');
      expect(input).toHaveValue('United States');
      // select a different option
      await userEvent.clear(input);
      await userEvent.type(input, 'united k');
      await userEvent.click(screen.getByText('United Kingdom'));
      expect(input).toHaveValue('United Kingdom');
      // reset back to the default value → query text re-derives to its label
      act(() => api.reset());
      expect(input).toHaveValue('United States');
    });
  });
});

describe('Combobox result-count announcement', () => {
  afterEach(() => {
    document.getElementById('ku-announcer-polite')?.remove();
  });

  it('announces the live result count via the shared announcer as the list filters', async () => {
    render(<Combobox label="Country" options={options} />);
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'united');
    await waitFor(() =>
      expect(document.getElementById('ku-announcer-polite')).toHaveTextContent(
        '2 results available',
      ),
    );
    await userEvent.type(input, ' kingdom');
    await waitFor(() =>
      expect(document.getElementById('ku-announcer-polite')).toHaveTextContent(
        '1 result available',
      ),
    );
  });
});

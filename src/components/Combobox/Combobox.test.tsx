import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox } from './Combobox';
import { FormField } from '../FormField';

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
});

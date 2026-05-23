import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Select } from './Select';

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', disabled: true },
];

describe('Select', () => {
  it('renders a labelled combobox trigger showing the placeholder', () => {
    render(<Select label="Fruit" placeholder="Pick one" options={options} />);
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    expect(trigger).toHaveTextContent('Pick one');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the listbox on click and lists options', () => {
    render(<Select label="Fruit" options={options} />);
    fireEvent.click(screen.getByRole('button', { name: /Fruit/ }));
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getAllByRole('option')).toHaveLength(3);
  });

  it('selects an option and reports the new value', () => {
    const onChange = vi.fn();
    render(<Select label="Fruit" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Fruit/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onChange).toHaveBeenCalledWith('b', expect.anything());
    expect(screen.getByRole('button', { name: /Fruit/ })).toHaveTextContent('Banana');
  });

  it('moves the active option with ArrowDown and selects with Enter', () => {
    const onChange = vi.fn();
    render(<Select label="Fruit" options={options} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    fireEvent.click(trigger);
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' }); // -> Apple
    fireEvent.keyDown(listbox, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('a', expect.anything());
  });

  it('does not select a disabled option', () => {
    const onChange = vi.fn();
    render(<Select label="Fruit" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Fruit/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks the trigger invalid and shows helper text on error', () => {
    render(<Select label="Fruit" options={options} error helperText="Required" />);
    expect(screen.getByRole('button', { name: /Fruit/ })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('restores focus to the trigger when closed via Escape', () => {
    render(<Select label="Fruit" options={options} />);
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    fireEvent.click(trigger);
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'Escape' });
    expect(trigger).toHaveFocus();
  });

  it('uses a consumer-provided id verbatim on the trigger', () => {
    render(<Select id="country" label="Country" options={options} />);
    expect(screen.getByRole('button', { name: /Country/ })).toHaveAttribute('id', 'country');
  });
});

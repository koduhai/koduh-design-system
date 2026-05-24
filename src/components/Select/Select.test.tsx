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

  it('shows helper text and links it via aria-describedby', () => {
    render(<Select label="Fruit" options={options} helperText="Pick one" />);
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    const describedBy = trigger.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('Pick one');
  });

  it('marks the trigger invalid and shows errorText (replacing helperText) on error', () => {
    render(
      <Select label="Fruit" options={options} error errorText="Required" helperText="Pick one" />,
    );
    expect(screen.getByRole('button', { name: /Fruit/ })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('Pick one')).toBeNull();
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

  it.each([['ArrowDown'], ['Enter'], [' ']])(
    'opens the listbox via %s on the trigger with the first enabled option active',
    (key) => {
      render(<Select label="Fruit" options={options} />);
      const trigger = screen.getByRole('button', { name: /Fruit/ });
      fireEvent.keyDown(trigger, { key });
      const listbox = screen.getByRole('listbox');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      // First enabled option is "Apple".
      expect(listbox).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Apple' }).id,
      );
    },
  );

  it('opens via ArrowUp on the trigger with the last enabled option active', () => {
    render(<Select label="Fruit" options={options} />);
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    const listbox = screen.getByRole('listbox');
    // Cherry is disabled, so the last enabled option is "Banana".
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Banana' }).id,
    );
  });

  it('keyboard-opens seeded to the selected option when one is set', () => {
    render(<Select label="Fruit" options={options} defaultValue="b" />);
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Banana' }).id,
    );
  });

  it('forwards arbitrary DOM props (name, data-*, onBlur) to the trigger', () => {
    const onBlur = vi.fn();
    render(
      <Select label="Fruit" options={options} name="fruit" data-testid="sel" onBlur={onBlur} />,
    );
    const trigger = screen.getByTestId('sel');
    expect(trigger).toHaveAttribute('name', 'fruit');
    fireEvent.blur(trigger);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('clearable: renders a clear button that resets the value and reports an empty string', () => {
    const onChange = vi.fn();
    render(
      <Select label="Fruit" options={options} defaultValue="a" clearable onChange={onChange} />,
    );
    expect(screen.getByRole('button', { name: /Fruit/ })).toHaveTextContent('Apple');
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith('', expect.anything());
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    // Reverts to the placeholder, and clicking clear must not open the listbox.
    expect(trigger).toHaveTextContent('Select');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('clearable: no clear button is shown while nothing is selected', () => {
    render(<Select label="Fruit" options={options} clearable />);
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
  });

  it('does not render a clear button without the clearable prop', () => {
    render(<Select label="Fruit" options={options} defaultValue="a" />);
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
  });

  it('does NOT restore focus to the trigger on outside-pointer dismiss', () => {
    render(
      <div>
        <button type="button">elsewhere</button>
        <Select label="Fruit" options={options} />
      </div>,
    );
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    const elsewhere = screen.getByRole('button', { name: 'elsewhere' });
    fireEvent.click(trigger);
    elsewhere.focus();
    fireEvent.pointerDown(elsewhere);
    expect(trigger).not.toHaveFocus();
  });

  it('renders a required indicator and sets aria-required on the trigger', () => {
    render(<Select label="Model" required options={[{ value: 'a', label: 'A' }]} />);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-required', 'true');
  });
});

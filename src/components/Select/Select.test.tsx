import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Select } from './Select';
import { KoduhI18nProvider } from '../../i18n';
import { FormField } from '../FormField';
import { Form } from '../Form/Form';
import { useForm } from '../Form/useForm';
import { useFormField } from '../Form/useFormField';

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

  it('scrolls the active option into view during keyboard navigation', () => {
    const scrollIntoView = vi.fn();
    // jsdom does not implement scrollIntoView; stub it so the effect can call it.
    const proto = Element.prototype as unknown as { scrollIntoView?: () => void };
    const prev = proto.scrollIntoView;
    proto.scrollIntoView = scrollIntoView;
    try {
      render(<Select label="Fruit" options={options} />);
      const trigger = screen.getByRole('button', { name: /Fruit/ });
      fireEvent.click(trigger);
      const listbox = screen.getByRole('listbox');
      scrollIntoView.mockClear();
      fireEvent.keyDown(listbox, { key: 'ArrowDown' }); // -> Apple
      const apple = screen.getByRole('option', { name: 'Apple' });
      expect(listbox).toHaveAttribute('aria-activedescendant', apple.id);
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    } finally {
      proto.scrollIntoView = prev;
    }
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
    // The error state is shown via data-error (aria-invalid is not valid on the
    // button-role trigger); the error text is conveyed through aria-describedby.
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    expect(trigger).toHaveAttribute('data-error', 'true');
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger.getAttribute('aria-describedby')).toContain(screen.getByText('Required').id);
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

  it('renders a required indicator on the trigger', () => {
    render(<Select label="Model" required options={[{ value: 'a', label: 'A' }]} />);
    expect(screen.getByText('*')).toBeInTheDocument();
    // aria-required is not valid on the button-role trigger; the indicator + the
    // enclosing FormField convey required instead.
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-required');
  });

  it('inside FormField: no own label span; trigger id + aria from context', () => {
    render(
      <FormField label="Model" required error errorText="Pick one" id="model">
        <Select options={[{ value: 'a', label: 'A' }]} />
      </FormField>,
    );
    const trigger = screen.getByRole('button');
    expect(trigger.id).toBe('model');
    // button role: no aria-required/aria-invalid; error via data-error + describedby.
    expect(trigger).not.toHaveAttribute('aria-required');
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).toHaveAttribute('data-error', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', screen.getByText('Pick one').id);
    expect(screen.getAllByText('Model')).toHaveLength(1);
  });

  it('inside FormField: trigger + listbox get an accessible name from the field label', () => {
    render(
      <FormField label="Model" id="model">
        <Select options={[{ value: 'a', label: 'A' }]} />
      </FormField>,
    );
    // The role="button" trigger can't be targeted by the field's <label htmlFor>,
    // so it must borrow the field label via aria-labelledby for an accessible name.
    const trigger = screen.getByRole('button', { name: /Model/ });
    expect(trigger).toHaveAttribute('aria-labelledby', screen.getByText('Model').id);
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox', { name: /Model/ })).toBeInTheDocument();
  });

  it('standalone: unchanged label + required indicator', () => {
    render(<Select label="Fruit" required options={[{ value: 'a', label: 'A' }]} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  describe('Select bound to a Form', () => {
    it('reads value from the form and writes selections back', () => {
      function Probe() {
        const f = useFormField('field');
        return <span data-testid="v">{JSON.stringify(f.value ?? null)}</span>;
      }
      function Wrap() {
        const form = useForm({ defaultValues: { field: 'a' } });
        return (
          <Form form={form} aria-label="f">
            <FormField name="field" label="L">
              <Select options={options} />
            </FormField>
            <Probe />
          </Form>
        );
      }
      render(<Wrap />);
      // bound default: trigger shows 'Apple'
      expect(screen.getByRole('button', { name: /L/ })).toHaveTextContent('Apple');
      // open and pick Banana
      fireEvent.click(screen.getByRole('button', { name: /L/ }));
      fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
      // form value updated
      expect(screen.getByTestId('v')).toHaveTextContent('"b"');
    });
  });

  describe('i18n', () => {
    it('uses the English default clear label with no provider', () => {
      render(<Select label="Fruit" options={options} defaultValue="a" clearable />);
      expect(screen.getByRole('button', { name: 'Clear selection' })).toBeInTheDocument();
    });

    it('flows a provider clearSelection override through to the clear button', () => {
      render(
        <KoduhI18nProvider messages={{ clearSelection: 'Effacer' }}>
          <Select label="Fruit" options={options} defaultValue="a" clearable />
        </KoduhI18nProvider>,
      );
      expect(screen.getByRole('button', { name: 'Effacer' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull();
    });

    it('lets the clearLabel prop override the provider', () => {
      render(
        <KoduhI18nProvider messages={{ clearSelection: 'Effacer' }}>
          <Select label="Fruit" options={options} defaultValue="a" clearable clearLabel="Wipe it" />
        </KoduhI18nProvider>,
      );
      expect(screen.getByRole('button', { name: 'Wipe it' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Effacer' })).toBeNull();
    });
  });

  describe('multi-select', () => {
    it('marks the listbox aria-multiselectable and toggles options without closing', () => {
      const onChange = vi.fn();
      render(<Select multiple label="Fruit" options={options} onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Fruit/ }));
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
      fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
      expect(onChange).toHaveBeenLastCalledWith(['a'], expect.anything());
      // Stays open for further selection.
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
      expect(onChange).toHaveBeenLastCalledWith(['a', 'b'], expect.anything());
    });

    it('renders selected values as removable chips and toggling off removes them', () => {
      const onChange = vi.fn();
      render(
        <Select
          multiple
          label="Fruit"
          options={options}
          defaultValue={['a', 'b']}
          onChange={onChange}
        />,
      );
      // Two chips, each with a Remove control.
      expect(screen.getByRole('button', { name: 'Remove Apple' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Banana' })).toBeInTheDocument();
      // Removing a chip reports the remaining values.
      fireEvent.click(screen.getByRole('button', { name: 'Remove Apple' }));
      expect(onChange).toHaveBeenLastCalledWith(['b'], expect.anything());
    });

    it('deselects an already-selected option', () => {
      const onChange = vi.fn();
      render(
        <Select
          multiple
          label="Fruit"
          options={options}
          defaultValue={['a']}
          onChange={onChange}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /Fruit/ }));
      const apple = screen.getByRole('option', { name: 'Apple' });
      expect(apple).toHaveAttribute('aria-selected', 'true');
      fireEvent.click(apple);
      expect(onChange).toHaveBeenLastCalledWith([], expect.anything());
    });

    it('Backspace on the trigger removes the last selected chip', () => {
      const onChange = vi.fn();
      render(
        <Select
          multiple
          label="Fruit"
          options={options}
          defaultValue={['a', 'b']}
          onChange={onChange}
        />,
      );
      const trigger = screen.getByRole('button', { name: /Fruit/ });
      fireEvent.keyDown(trigger, { key: 'Backspace' });
      expect(onChange).toHaveBeenLastCalledWith(['a'], expect.anything());
    });

    it('shows the placeholder only while nothing is selected', () => {
      const { rerender } = render(
        <Select multiple label="Fruit" placeholder="Pick fruit" options={options} value={[]} />,
      );
      expect(screen.getByText('Pick fruit')).toBeInTheDocument();
      rerender(
        <Select multiple label="Fruit" placeholder="Pick fruit" options={options} value={['a']} />,
      );
      expect(screen.queryByText('Pick fruit')).toBeNull();
    });

    it('clearable: clears all selections and reports an empty array', () => {
      const onChange = vi.fn();
      render(
        <Select
          multiple
          label="Fruit"
          options={options}
          defaultValue={['a', 'b']}
          clearable
          onChange={onChange}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /clear/i }));
      expect(onChange).toHaveBeenLastCalledWith([], expect.anything());
    });

    it('binds to a Form with an array value', () => {
      function Probe() {
        const f = useFormField('fruits');
        return <span data-testid="v">{JSON.stringify(f.value ?? null)}</span>;
      }
      function Wrap() {
        const form = useForm({ defaultValues: { fruits: ['a'] } });
        return (
          <Form form={form} aria-label="f">
            <FormField name="fruits" label="Fruits">
              <Select multiple options={options} />
            </FormField>
            <Probe />
          </Form>
        );
      }
      render(<Wrap />);
      expect(screen.getByTestId('v')).toHaveTextContent('["a"]');
      fireEvent.click(screen.getByRole('button', { name: /Fruits/ }));
      fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
      expect(screen.getByTestId('v')).toHaveTextContent('["a","b"]');
    });

    it('flows a provider removeOption override through to the chip remove label', () => {
      render(
        <KoduhI18nProvider messages={{ combobox: { removeOption: (l) => `Retirer ${l}` } }}>
          <Select multiple label="Fruit" options={options} defaultValue={['a']} />
        </KoduhI18nProvider>,
      );
      expect(screen.getByRole('button', { name: 'Retirer Apple' })).toBeInTheDocument();
    });
  });

  it('omits data-density by default and reflects density="compact" on the trigger + listbox', () => {
    const { rerender } = render(<Select label="Fruit" options={options} />);
    expect(screen.getByRole('button', { name: /Fruit/ })).not.toHaveAttribute('data-density');
    rerender(<Select label="Fruit" options={options} density="compact" />);
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    expect(trigger).toHaveAttribute('data-density', 'compact');
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toHaveAttribute('data-density', 'compact');
  });
});

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Select } from './Select';
import { FormField } from '../FormField';

const options = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
];

const meta = { title: 'Components/Select', component: Select } satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Country', options, placeholder: 'Choose a country' },
  render: function DefaultStory() {
    const [value, setValue] = useState<string>();
    return (
      <div style={{ padding: 40 }}>
        <Select
          label="Country"
          options={options}
          placeholder="Choose a country"
          value={value}
          onChange={(v) => setValue(v)}
        />
      </div>
    );
  },
};

/**
 * Wrapped in a `<FormField>`: the field supplies the label, the required
 * indicator, and the error/aria wiring. Select defers to the context — it omits
 * its own label span and description and sources `aria-invalid`/`aria-required`/
 * `aria-describedby` (and the trigger `id`) from the field.
 */
export const WithFormField: Story = {
  args: { label: 'Country', options },
  render: function WithFormFieldStory() {
    const [value, setValue] = useState<string>();
    return (
      <div style={{ padding: 40, maxWidth: 320 }}>
        <FormField label="Country" required error errorText="Please pick a country." id="country">
          <Select options={options} value={value} onChange={(v) => setValue(v)} />
        </FormField>
      </div>
    );
  },
};

/**
 * `multiple`: selected values render as removable chips in the trigger, the
 * listbox is `aria-multiselectable`, and clicking an option toggles it without
 * closing the listbox. The reported value is a `string[]`.
 */
export const Multiple: Story = {
  args: { label: 'Countries', options, multiple: true },
  render: function MultipleStory() {
    const [value, setValue] = useState<string[]>(['us', 'ca']);
    return (
      <div style={{ padding: 40, maxWidth: 360 }}>
        <Select
          multiple
          label="Countries"
          options={options}
          placeholder="Choose countries"
          value={value}
          onChange={setValue}
          clearable
        />
      </div>
    );
  },
};

export const Showcase: Story = {
  args: { label: 'Country', options },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'flex', gap: 32, padding: 40 }}>
      <Select label="Default" options={options} placeholder="Choose…" />
      <Select label="Selected" options={options} defaultValue="ca" />
      <Select label="Clearable" options={options} defaultValue="ca" clearable />
      <Select label="Error" options={options} error helperText="Required" />
      <Select label="Disabled" options={options} disabled placeholder="Choose…" />
      <Select label="Compact" options={options} density="compact" placeholder="Choose…" />
    </div>
  ),
};

/** `density="compact"` tightens the trigger and option padding for dense UIs. */
export const Compact: Story = {
  args: { label: 'Country', options, density: 'compact', placeholder: 'Choose…' },
  render: () => (
    <div style={{ padding: 40 }}>
      <Select label="Country" options={options} density="compact" placeholder="Choose…" />
    </div>
  ),
};

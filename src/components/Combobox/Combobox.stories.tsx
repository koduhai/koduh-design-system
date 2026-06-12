import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Combobox } from './Combobox';
import { FormField } from '../FormField';

const options = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
];

const meta = { title: 'Components/Combobox', component: Combobox } satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Country', options, placeholder: 'Search a country' },
  render: function DefaultStory() {
    const [value, setValue] = useState<string>();
    return (
      <div style={{ padding: 40 }}>
        <Combobox
          label="Country"
          options={options}
          placeholder="Search a country"
          value={value}
          onChange={(v) => setValue(v)}
        />
      </div>
    );
  },
};

export const Clearable: Story = {
  args: { label: 'Country', options, clearable: true },
  render: function ClearableStory() {
    const [value, setValue] = useState<string>('us');
    return (
      <div style={{ padding: 40 }}>
        <Combobox
          label="Country"
          options={options}
          clearable
          value={value}
          onChange={(v) => setValue(v)}
        />
      </div>
    );
  },
};

export const Multiple: Story = {
  args: { label: 'Countries', options },
  render: function MultipleStory() {
    const [value, setValue] = useState<string[]>(['us', 'jp']);
    return (
      <div style={{ padding: 40 }}>
        <Combobox
          label="Countries"
          multiple
          options={options}
          placeholder="Add countries"
          value={value}
          onChange={(v) => setValue(v)}
          clearable
        />
      </div>
    );
  },
};

export const WithFormField: Story = {
  args: { label: 'Country', options },
  render: () => (
    <div style={{ padding: 40 }}>
      <FormField label="Country" required helperText="Start typing to search" id="cb-country">
        <Combobox options={options} placeholder="Search…" />
      </FormField>
    </div>
  ),
};

export const Showcase: Story = {
  args: { label: 'Country', options },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'flex', gap: 32, padding: 40 }}>
      <Combobox label="Country" options={options} placeholder="Search…" />
      <Combobox
        label="Required country"
        options={options}
        required
        error
        errorText="Pick a country"
      />
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Combobox } from './Combobox';

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
  render: function DefaultStory(args) {
    const [value, setValue] = useState<string>();
    return (
      <div style={{ padding: 40 }}>
        <Combobox {...args} value={value} onChange={(v) => setValue(v)} />
      </div>
    );
  },
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

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Select } from './Select';

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
  render: function DefaultStory(args) {
    const [value, setValue] = useState<string>();
    return (
      <div style={{ padding: 40 }}>
        <Select {...args} value={value} onChange={(v) => setValue(v)} />
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
      <Select label="Error" options={options} error helperText="Required" />
      <Select label="Disabled" options={options} disabled placeholder="Choose…" />
    </div>
  ),
};

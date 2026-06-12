import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
} satisfies Meta<typeof Checkbox>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Accept terms' } };

export const Showcase: Story = {
  args: { label: 'Default' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Indeterminate" indeterminate />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled checked" disabled defaultChecked />
      <Checkbox label="Error" error />
      <Checkbox label="Error checked" error defaultChecked />
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Checkbox label="Small" size="sm" defaultChecked />
        <Checkbox label="Medium" size="md" defaultChecked />
        <Checkbox label="Large" size="lg" defaultChecked />
      </div>
    </div>
  ),
};

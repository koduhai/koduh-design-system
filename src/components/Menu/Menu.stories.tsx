import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from './Menu';
import { Button } from '../Button';

const items = [
  { label: 'Edit', onSelect: () => {} },
  { label: 'Duplicate', onSelect: () => {} },
  { type: 'separator' as const },
  { label: 'Delete', onSelect: () => {}, disabled: true },
];

const meta = { title: 'Components/Menu', component: Menu } satisfies Meta<typeof Menu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { trigger: <Button>Actions</Button>, items },
  render: (args) => (
    <div style={{ padding: 40 }}>
      <Menu {...args} />
    </div>
  ),
};

export const Showcase: Story = {
  args: { trigger: <Button>Actions</Button>, items },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'flex', gap: 32, padding: 40 }}>
      <Menu trigger={<Button>Open actions menu</Button>} items={items} />
      <Menu trigger={<Button>Compact menu</Button>} items={items} density="compact" />
    </div>
  ),
};

/** `density="compact"` tightens the menu item padding for dense action lists. */
export const Compact: Story = {
  args: { trigger: <Button>Actions</Button>, items, density: 'compact' },
  render: (args) => (
    <div style={{ padding: 40 }}>
      <Menu {...args} />
    </div>
  ),
};

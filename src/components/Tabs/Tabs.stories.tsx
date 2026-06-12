import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from './Tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>;
export default meta;

type Story = StoryObj<typeof meta>;

const items = [
  { id: 'overview', label: 'Overview', content: 'Overview content goes here.' },
  { id: 'specs', label: 'Specs', content: 'Specifications content goes here.' },
  { id: 'reviews', label: 'Reviews', content: 'Reviews content goes here.' },
];

export const Default: Story = { args: { items } };

export const Showcase: Story = {
  args: { items },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 520 }}>
      <Tabs items={items} />
      <Tabs
        orientation="vertical"
        items={[
          { id: 'account', label: 'Account', content: 'Account settings.' },
          { id: 'security', label: 'Security', content: 'Security settings.' },
          { id: 'billing', label: 'Billing', content: 'Billing settings.' },
        ]}
      />
      <Tabs
        items={[
          { id: 'active', label: 'Active', content: 'This tab is active.' },
          { id: 'disabled', label: 'Disabled', content: 'Disabled content.', disabled: true },
          { id: 'last', label: 'Last', content: 'Last tab content.' },
        ]}
      />
    </div>
  ),
};

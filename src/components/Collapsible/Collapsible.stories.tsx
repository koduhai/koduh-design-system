import type { Meta, StoryObj } from '@storybook/react-vite';
import { Collapsible } from './Collapsible';

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
} satisfies Meta<typeof Collapsible>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    trigger: 'What is your refund policy?',
    children: 'Return any item within 30 days for a full refund, no questions asked.',
  },
};

export const Showcase: Story = {
  args: { trigger: 'Toggle', children: 'Content' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Closed (default)</h4>
        <Collapsible trigger="Shipping & delivery">
          Orders ship within 2 business days. Standard delivery takes 3–5 days.
        </Collapsible>
      </section>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Open (defaultOpen)</h4>
        <Collapsible trigger="Returns & refunds" defaultOpen>
          Return any item within 30 days for a full refund, no questions asked.
        </Collapsible>
      </section>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Disabled</h4>
        <Collapsible trigger="Coming soon" disabled>
          Not available yet.
        </Collapsible>
      </section>
    </div>
  ),
};

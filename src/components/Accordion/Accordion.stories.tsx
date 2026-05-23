import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion } from './Accordion';

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
} satisfies Meta<typeof Accordion>;
export default meta;

type Story = StoryObj<typeof meta>;

const items = [
  {
    id: 'shipping',
    title: 'Shipping & delivery',
    content: 'Orders ship within 2 business days. Standard delivery takes 3–5 days.',
  },
  {
    id: 'returns',
    title: 'Returns & refunds',
    content: 'Return any item within 30 days for a full refund, no questions asked.',
  },
  {
    id: 'warranty',
    title: 'Warranty',
    content: 'All products carry a 2-year limited manufacturer warranty.',
  },
];

export const Default: Story = {
  args: { items, defaultValue: 'shipping' },
};

export const Showcase: Story = {
  args: { items },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 520 }}>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Single (collapsible)</h4>
        <Accordion items={items} defaultValue="shipping" collapsible />
      </section>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Multiple</h4>
        <Accordion items={items} multiple defaultValue={['returns', 'warranty']} />
      </section>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>With a disabled item</h4>
        <Accordion
          items={[
            items[0]!,
            {
              id: 'soon',
              title: 'Coming soon (disabled)',
              content: 'Not available yet.',
              disabled: true,
            },
            items[2]!,
          ]}
        />
      </section>
    </div>
  ),
};

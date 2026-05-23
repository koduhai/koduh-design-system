import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Card content', style: { maxWidth: 320 } },
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <Card variant="outlined" style={{ width: 200 }}>
        Outlined
      </Card>
      <Card variant="elevated" style={{ width: 200 }}>
        Elevated
      </Card>
      <Card variant="flat" style={{ width: 200 }}>
        Flat
      </Card>
      <Card variant="outlined" padding="lg" style={{ width: 200 }}>
        Large padding
      </Card>
    </div>
  ),
};

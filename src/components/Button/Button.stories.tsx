import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Button' } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button variant="solid" tone="primary">
        Solid
      </Button>
      <Button variant="outline" tone="primary">
        Outline
      </Button>
      <Button variant="ghost" tone="primary">
        Ghost
      </Button>
      <Button tone="neutral">Neutral</Button>
      <Button tone="success">Success</Button>
      <Button tone="warning">Warning</Button>
      <Button tone="danger">Danger</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

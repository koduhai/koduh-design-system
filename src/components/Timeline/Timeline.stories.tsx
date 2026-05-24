import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from './Timeline';

const meta = {
  title: 'Components/Timeline',
  component: Timeline,
} satisfies Meta<typeof Timeline>;
export default meta;

type Story = StoryObj<typeof meta>;

const ITEMS = [
  {
    id: '1',
    title: 'Deployment succeeded',
    time: '2 min ago',
    content: 'v2.4.0 rolled out to production across all regions.',
  },
  {
    id: '2',
    title: 'Build passed',
    time: '8 min ago',
    content: 'All checks green: unit, types, a11y.',
  },
  {
    id: '3',
    title: 'Pull request merged',
    time: '12 min ago',
  },
  {
    id: '4',
    title: 'Review approved',
    time: '1 hr ago',
    icon: '✓',
  },
];

export const Default: Story = {
  args: { items: ITEMS },
};

export const Showcase: Story = {
  args: { items: ITEMS },
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Timeline items={ITEMS} aria-label="Activity history" />
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { HoverCard } from './HoverCard';
import { Button } from '../Button';

const meta = {
  title: 'Components/HoverCard',
  component: HoverCard,
} satisfies Meta<typeof HoverCard>;
export default meta;

type Story = StoryObj<typeof meta>;

const ProfileCard = (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <strong>@koduhai</strong>
    <span style={{ color: 'var(--ku-color-text-secondary)' }}>
      Maintainer of @koduhai/design-system. Building accessible, zero-dependency React components.
    </span>
  </div>
);

export const Default: Story = {
  args: {
    trigger: <Button variant="ghost">@koduhai</Button>,
    children: ProfileCard,
  },
};

export const Showcase: Story = {
  args: { trigger: <span>hover</span>, children: ProfileCard },
  render: () => (
    <div style={{ display: 'flex', gap: 48, padding: 80, flexWrap: 'wrap' }}>
      <HoverCard trigger={<Button variant="ghost">Bottom</Button>} placement="bottom">
        {ProfileCard}
      </HoverCard>
      <HoverCard trigger={<Button variant="outline">Top</Button>} placement="top">
        {ProfileCard}
      </HoverCard>
      <HoverCard
        trigger={<Button variant="ghost">Fast (no delay)</Button>}
        openDelay={0}
        closeDelay={0}
      >
        {ProfileCard}
      </HoverCard>
      <HoverCard trigger={<a href="#link">A link trigger</a>} placement="right">
        {ProfileCard}
      </HoverCard>
    </div>
  ),
};

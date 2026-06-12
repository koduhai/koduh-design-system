import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarGroup } from './AvatarGroup';
import { Avatar } from '../Avatar';

const meta = {
  title: 'Components/AvatarGroup',
  component: AvatarGroup,
} satisfies Meta<typeof AvatarGroup>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    max: 4,
    children: [
      <Avatar key="1" name="Ada Lovelace" />,
      <Avatar key="2" name="Grace Hopper" />,
      <Avatar key="3" name="Alan Turing" />,
      <Avatar key="4" name="Linus Torvalds" />,
      <Avatar key="5" name="Edsger Dijkstra" />,
    ],
  },
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AvatarGroup size="sm" max={3}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Alan Turing" />
        <Avatar name="Linus Torvalds" />
      </AvatarGroup>
      <AvatarGroup size="md" max={4} total={42}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Alan Turing" />
      </AvatarGroup>
      <AvatarGroup size="lg" shape="square" spacing="tight">
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
      </AvatarGroup>
    </div>
  ),
};

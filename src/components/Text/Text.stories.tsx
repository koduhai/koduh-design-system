import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';

const meta = {
  title: 'Components/Text',
  component: Text,
} satisfies Meta<typeof Text>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Body text' } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Text size="2xl">2xl — the quick brown fox</Text>
      <Text size="xl">xl — the quick brown fox</Text>
      <Text size="lg">lg — the quick brown fox</Text>
      <Text size="md">md — the quick brown fox</Text>
      <Text size="sm">sm — the quick brown fox</Text>
      <Text size="xs">xs — the quick brown fox</Text>
      <Text weight="bold">Bold weight</Text>
      <Text tone="secondary">Secondary tone</Text>
      <Text as="p">Rendered as a paragraph element.</Text>
    </div>
  ),
};

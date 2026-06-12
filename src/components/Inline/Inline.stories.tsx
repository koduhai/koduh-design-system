import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inline } from './Inline';

const meta = {
  title: 'Components/Inline',
  component: Inline,
} satisfies Meta<typeof Inline>;
export default meta;

type Story = StoryObj<typeof meta>;

const box = (label: string) => (
  <div
    key={label}
    style={{
      padding: 'var(--ku-space-3) var(--ku-space-4)',
      background: 'var(--ku-color-bg-surface)',
      borderRadius: 'var(--ku-radius-md)',
      color: 'var(--ku-color-text-primary)',
    }}
  >
    {label}
  </div>
);

export const Default: Story = {
  args: {
    gap: 4,
    children: [box('One'), box('Two'), box('Three')],
  },
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Inline gap={4} align="center">
        {box('Alpha')}
        {box('Bravo')}
        {box('Charlie')}
      </Inline>
      <Inline gap={2} wrap style={{ maxWidth: 240 }}>
        {box('Wrap 1')}
        {box('Wrap 2')}
        {box('Wrap 3')}
        {box('Wrap 4')}
        {box('Wrap 5')}
      </Inline>
    </div>
  ),
};

/** Gap responds to viewport width: tight on mobile, looser from `md` up. */
export const ResponsiveGap: Story = {
  render: () => (
    <Inline gap={{ base: 1, md: 6 }}>
      {box('One')}
      {box('Two')}
      {box('Three')}
    </Inline>
  ),
};

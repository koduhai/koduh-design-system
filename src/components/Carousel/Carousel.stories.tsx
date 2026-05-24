import type { Meta, StoryObj } from '@storybook/react-vite';
import { Carousel } from './Carousel';

const meta = {
  title: 'Components/Carousel',
  component: Carousel,
} satisfies Meta<typeof Carousel>;
export default meta;

type Story = StoryObj<typeof meta>;

const slide = (label: string, bg: string) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: 120,
      borderRadius: 8,
      background: bg,
      color: 'var(--ku-color-primary-contrast)',
      fontSize: 'var(--ku-font-size-lg)',
      fontWeight: 600,
    }}
  >
    {label}
  </div>
);

const items = [
  { id: 'one', content: slide('Slide one', 'var(--ku-color-primary)') },
  { id: 'two', content: slide('Slide two', 'var(--ku-color-success)') },
  { id: 'three', content: slide('Slide three', 'var(--ku-color-warning)') },
];

export const Default: Story = {
  args: { items, 'aria-label': 'Featured highlights' },
};

export const Showcase: Story = {
  args: { items, 'aria-label': 'Featured highlights' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 480 }}>
      <Carousel items={items} aria-label="Default carousel" />
      <Carousel items={items} loop defaultIndex={1} aria-label="Looping carousel" />
      <Carousel
        items={[{ id: 'solo', content: slide('Only slide', 'var(--ku-color-primary)') }]}
        aria-label="Single-slide carousel"
      />
    </div>
  ),
};

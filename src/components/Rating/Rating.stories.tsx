import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rating } from './Rating';

const meta = {
  title: 'Components/Rating',
  component: Rating,
} satisfies Meta<typeof Rating>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultValue: 3, 'aria-label': 'Rate this product' },
};

export const Showcase: Story = {
  args: { 'aria-label': 'Rating' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Sizes</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Rating size="sm" defaultValue={3} aria-label="Small rating" />
          <Rating size="md" defaultValue={3} aria-label="Medium rating" />
          <Rating size="lg" defaultValue={3} aria-label="Large rating" />
        </div>
      </section>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Values</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Rating defaultValue={0} aria-label="Empty rating" />
          <Rating defaultValue={2} aria-label="Two stars" />
          <Rating defaultValue={5} aria-label="Full rating" />
        </div>
      </section>
      <section>
        <h4 style={{ margin: '0 0 8px' }}>Read-only & custom max</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Rating value={4} readOnly aria-label="Average rating 4 of 5" />
          <Rating defaultValue={6} max={10} aria-label="Rating out of ten" />
        </div>
      </section>
    </div>
  ),
};

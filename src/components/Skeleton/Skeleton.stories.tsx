import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { width: 240 } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 360 }}>
      {/* Text lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
      </div>

      {/* Rect + circle */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Skeleton variant="circle" width={48} height={48} />
        <Skeleton variant="rect" width={200} height={48} />
      </div>

      {/* No animation */}
      <Skeleton variant="rect" width={240} height={24} animation="none" />

      {/* Composed card skeleton */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 16,
          border: '1px solid var(--ku-color-border)',
          borderRadius: 'var(--ku-radius-lg)',
        }}
      >
        <Skeleton variant="rect" width="100%" height={140} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton variant="circle" width={40} height={40} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      </div>
    </div>
  ),
};

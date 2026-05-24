import type { Meta, StoryObj } from '@storybook/react-vite';
import { AspectRatio } from './AspectRatio';

const meta = {
  title: 'Components/AspectRatio',
  component: AspectRatio,
} satisfies Meta<typeof AspectRatio>;
export default meta;

type Story = StoryObj<typeof meta>;

const fill = (label: string) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ku-color-bg-raised)',
      color: 'var(--ku-color-text-secondary)',
      border: '1px solid var(--ku-color-border)',
      borderRadius: 'var(--ku-radius-md)',
      fontFamily: 'var(--ku-font-family-base)',
    }}
  >
    {label}
  </div>
);

export const Default: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <AspectRatio>{fill('16 / 9')}</AspectRatio>
    </div>
  ),
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ width: 200 }}>
        <AspectRatio ratio={16 / 9}>{fill('16 / 9')}</AspectRatio>
      </div>
      <div style={{ width: 200 }}>
        <AspectRatio ratio={4 / 3}>{fill('4 / 3')}</AspectRatio>
      </div>
      <div style={{ width: 200 }}>
        <AspectRatio ratio={1}>{fill('1 / 1')}</AspectRatio>
      </div>
    </div>
  ),
};

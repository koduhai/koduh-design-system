import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Loading' } };

const sizes = ['sm', 'md', 'lg'] as const;
const tones = ['primary', 'neutral'] as const;

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {tones.map((tone) => (
        <div key={tone} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ width: 80, fontFamily: 'var(--ku-font-family-base)' }}>{tone}</span>
          {sizes.map((size) => (
            <Spinner key={size} size={size} tone={tone} />
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Spinner label="Loading data" />
        <span style={{ fontFamily: 'var(--ku-font-family-base)' }}>labeled (role=status)</span>
      </div>
    </div>
  ),
};

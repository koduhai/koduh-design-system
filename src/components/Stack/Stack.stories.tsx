import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Stack } from './Stack';

const meta = {
  title: 'Components/Stack',
  component: Stack,
} satisfies Meta<typeof Stack>;
export default meta;

type Story = StoryObj<typeof meta>;

const boxStyle: CSSProperties = {
  padding: 'var(--ku-space-4)',
  background: 'var(--ku-color-bg-surface)',
  borderRadius: 'var(--ku-radius-md)',
  color: 'var(--ku-color-text-primary)',
};

export const Default: Story = {
  render: () => (
    <Stack gap={4}>
      <div style={boxStyle}>One</div>
      <div style={boxStyle}>Two</div>
      <div style={boxStyle}>Three</div>
    </Stack>
  ),
};

export const Showcase: Story = {
  render: () => (
    <Stack gap={6}>
      <Stack gap={4}>
        <div style={boxStyle}>Stack gap=4</div>
        <div style={boxStyle}>Vertical by default</div>
        <div style={boxStyle}>Children flow top to bottom</div>
      </Stack>
      <Stack gap={4} align="center">
        <div style={boxStyle}>align=&quot;center&quot;</div>
        <div style={boxStyle}>Items centered on the cross axis</div>
      </Stack>
    </Stack>
  ),
};

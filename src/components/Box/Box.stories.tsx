import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Box } from './Box';

const meta = {
  title: 'Components/Box',
  component: Box,
} satisfies Meta<typeof Box>;
export default meta;

type Story = StoryObj<typeof meta>;

const surface: CSSProperties = {
  background: 'var(--ku-color-bg-surface)',
  borderRadius: 'var(--ku-radius-md)',
  color: 'var(--ku-color-text-primary)',
  border: '1px solid var(--ku-color-border-default)',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: 'var(--ku-space-4)',
  alignItems: 'center',
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ku-space-6)' }}>
      {/* Padded boxes */}
      <div style={rowStyle}>
        <Box padding={2} style={surface}>
          padding=2
        </Box>
        <Box padding={4} style={surface}>
          padding=4
        </Box>
        <Box px={6} py={2} style={surface}>
          px=6 py=2
        </Box>
      </div>

      {/* grow example: the middle box grows to fill the row */}
      <div style={rowStyle}>
        <Box padding={3} style={surface}>
          fixed
        </Box>
        <Box grow padding={3} style={surface}>
          grow (fills remaining space)
        </Box>
        <Box padding={3} style={surface}>
          fixed
        </Box>
      </div>

      {/* minWidth=0 lets a flex child truncate instead of overflowing */}
      <div style={{ ...rowStyle, width: '320px' }}>
        <Box padding={3} style={{ ...surface, whiteSpace: 'nowrap' }}>
          Label
        </Box>
        <Box
          grow
          minWidth={0}
          padding={3}
          style={{
            ...surface,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          minWidth=0 truncating child with a very long unbreakable string of content
        </Box>
      </div>
    </div>
  ),
};

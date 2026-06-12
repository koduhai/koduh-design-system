import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Grid } from './Grid';

const meta = {
  title: 'Components/Grid',
  component: Grid,
} satisfies Meta<typeof Grid>;
export default meta;

type Story = StoryObj<typeof meta>;

const boxStyle: CSSProperties = {
  padding: 'var(--ku-space-4)',
  background: 'var(--ku-color-bg-surface)',
  border: '1px solid var(--ku-color-border)',
  borderRadius: 'var(--ku-radius-md)',
  color: 'var(--ku-color-text-primary)',
  textAlign: 'center',
};

function Box({ children }: { children: React.ReactNode }) {
  return <div style={boxStyle}>{children}</div>;
}

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section aria-label="Fixed three-column grid">
        <Grid columns={3} gap={4}>
          {Array.from({ length: 6 }, (_, i) => (
            <Box key={i}>Cell {i + 1}</Box>
          ))}
        </Grid>
      </section>
      <section aria-label="Auto-fit grid with minimum item width">
        <Grid minItemWidth="200px" gap={4}>
          {Array.from({ length: 6 }, (_, i) => (
            <Box key={i}>Item {i + 1}</Box>
          ))}
        </Grid>
      </section>
    </div>
  ),
};

export const Responsive: Story = {
  render: () => (
    <section aria-label="Responsive grid: 1 column on mobile, 2 at md, 3 at lg">
      <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={{ base: 2, md: 4 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Box key={i}>Cell {i + 1}</Box>
        ))}
      </Grid>
    </section>
  ),
};

export const Ratio: Story = {
  render: () => (
    <section aria-label="Grid with a 2:1 track ratio (sidebar layout)">
      <Grid columns={[2, 1]} gap={4}>
        <Box>Main (2fr)</Box>
        <Box>Aside (1fr)</Box>
      </Grid>
    </section>
  ),
};

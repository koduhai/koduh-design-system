import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container } from './Container';

const meta = {
  title: 'Components/Container',
  component: Container,
} satisfies Meta<typeof Container>;
export default meta;

type Story = StoryObj<typeof meta>;

const box = {
  border: '1px dashed var(--ku-color-border)',
  background: 'var(--ku-color-bg-surface)',
  padding: 'var(--ku-space-4)',
  borderRadius: 'var(--ku-radius-md)',
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Container>
        <div style={box}>Default container (size lg, padded) — centered max-width wrapper.</div>
      </Container>
      <Container size="sm">
        <div style={box}>size=&quot;sm&quot; — narrower max-width, still centered.</div>
      </Container>
    </div>
  ),
};

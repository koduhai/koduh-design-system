import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from './Kbd';

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
} satisfies Meta<typeof Kbd>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Esc' } };

export const Showcase: Story = {
  args: { children: 'Esc' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Kbd size="sm">Esc</Kbd>
        <Kbd size="sm">⌘</Kbd>
        <Kbd size="sm">K</Kbd>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Kbd>Ctrl</Kbd>
        <span aria-hidden>+</span>
        <Kbd>Shift</Kbd>
        <span aria-hidden>+</span>
        <Kbd>P</Kbd>
      </div>
      <p style={{ margin: 0 }}>
        Press <Kbd size="sm">⌘</Kbd> <Kbd size="sm">K</Kbd> to open the command palette.
      </p>
    </div>
  ),
};

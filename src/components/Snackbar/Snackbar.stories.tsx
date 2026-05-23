import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Snackbar } from './Snackbar';
import { Button } from '../Button';

const meta = {
  title: 'Components/Snackbar',
  component: Snackbar,
} satisfies Meta<typeof Snackbar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { open: true, onClose: () => {}, message: 'Changes saved', severity: 'success' },
  render: function DefaultStory(args) {
    const [open, setOpen] = useState(true);
    return (
      <div style={{ minHeight: 160 }}>
        <Button onClick={() => setOpen(true)}>Show snackbar</Button>
        <Snackbar {...args} open={open} onClose={() => setOpen(false)} />
      </div>
    );
  },
};

// Renders one OPEN snackbar per severity (stacked) with auto-hide disabled so
// axe/visual capture them. Inline positioning overrides the fixed placement so
// all four are visible simultaneously in the story canvas.
export const Showcase: Story = {
  args: { open: true, onClose: () => {}, message: 'Message' },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        maxWidth: 520,
      }}
    >
      {(['info', 'success', 'warning', 'error'] as const).map((severity) => (
        <Snackbar
          key={severity}
          open
          onClose={() => {}}
          severity={severity}
          message={`This is a ${severity} message.`}
          action={
            severity === 'error' ? (
              <Button size="sm" variant="ghost" tone="neutral">
                Retry
              </Button>
            ) : undefined
          }
          style={{ position: 'static', transform: 'none', maxWidth: 'none' }}
        />
      ))}
    </div>
  ),
};

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CommandPalette } from './CommandPalette';
import { Button } from '../Button';

const meta = {
  title: 'Components/CommandPalette',
  component: CommandPalette,
} satisfies Meta<typeof CommandPalette>;
export default meta;

type Story = StoryObj<typeof meta>;

const commands = [
  {
    id: 'new-doc',
    label: 'New document',
    group: 'Actions',
    keywords: 'create file',
    onSelect: () => {},
  },
  { id: 'open', label: 'Open…', group: 'Actions', keywords: 'file', onSelect: () => {} },
  {
    id: 'settings',
    label: 'Open settings',
    group: 'Navigation',
    keywords: 'preferences',
    onSelect: () => {},
  },
  {
    id: 'profile',
    label: 'Go to profile',
    group: 'Navigation',
    keywords: 'account user',
    onSelect: () => {},
  },
  { id: 'logout', label: 'Sign out', group: 'Navigation', onSelect: () => {} },
];

export const Default: Story = {
  args: { open: true, onOpenChange: () => {}, commands },
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open command palette (⌘K)</Button>
          <CommandPalette open={open} onOpenChange={setOpen} commands={commands} />
        </>
      );
    }
    return <Demo />;
  },
};

export const Showcase: Story = {
  args: { open: true, onOpenChange: () => {}, commands },
  render: () => (
    <div style={{ minHeight: 420 }}>
      <CommandPalette open onOpenChange={() => {}} commands={commands} />
    </div>
  ),
};

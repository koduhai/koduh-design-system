import {
  Dialog,
  Drawer,
  Snackbar,
  Toaster,
  Popover,
  Popconfirm,
  HoverCard,
  Tooltip,
  Menu,
  CommandPalette,
  Button,
} from '@koduhai/design-system';
import type { Seed } from './types';

// Playground seeds for Overlay/floating components. Add: Name: { Component, props?, children? }.
const seeds: Record<string, Seed> = {
  Dialog: {
    Component: Dialog,
    props: { title: 'Delete project' },
    children:
      'This action cannot be undone. The project and all of its data will be permanently removed.',
  },
  Drawer: {
    Component: Drawer,
    props: { title: 'Filters' },
    children: 'Refine the results using the controls in this panel.',
  },
  Snackbar: {
    Component: Snackbar,
    props: { severity: 'info', autoHideDuration: 4000 },
    children: 'This is an info message.',
  },
  Toaster: {
    Component: Toaster,
    props: { placement: 'bottom-right' },
  },
  Popover: {
    Component: Popover,
    props: {
      role: 'dialog',
      'aria-label': 'Quick settings',
      trigger: <Button>Open popover</Button>,
      children: (
        <div style={{ padding: 'var(--ku-space-2)', maxWidth: 240 }}>
          <strong>Quick settings</strong>
        </div>
      ),
    },
  },
  Popconfirm: {
    Component: Popconfirm,
    props: {
      title: 'Delete item?',
      confirmLabel: 'Delete',
      confirmTone: 'danger',
      onConfirm: () => {},
      trigger: (
        <Button tone="danger" variant="outline">
          Delete
        </Button>
      ),
      children: 'This permanently removes the item. Are you sure?',
    },
  },
  HoverCard: {
    Component: HoverCard,
    props: {
      trigger: <Button variant="ghost">@koduhai</Button>,
      children: (
        <div style={{ padding: 'var(--ku-space-2)', maxWidth: 260 }}>
          <strong>Koduhai</strong>
        </div>
      ),
    },
  },
  Tooltip: {
    Component: Tooltip,
    props: { content: 'Save your changes (Cmd+S)', children: <Button>Save</Button> },
  },
  Menu: {
    Component: Menu,
    props: {
      trigger: <Button variant="outline">Actions</Button>,
      items: [
        { label: 'Edit', onSelect: () => {} },
        { label: 'Duplicate', onSelect: () => {} },
        { label: 'Archive', onSelect: () => {} },
        { type: 'separator' },
        { label: 'Delete', onSelect: () => {} },
        { label: 'Unavailable', onSelect: () => {}, disabled: true },
      ],
    },
  },
  CommandPalette: {
    Component: CommandPalette,
    props: {
      commands: [
        { id: 'new', label: 'New file', group: 'File', onSelect: () => {} },
        { id: 'open', label: 'Open file', group: 'File', onSelect: () => {} },
        { id: 'save', label: 'Save', group: 'File', keywords: 'write disk', onSelect: () => {} },
        { id: 'copy', label: 'Copy', group: 'Edit', onSelect: () => {} },
        { id: 'paste', label: 'Paste', group: 'Edit', onSelect: () => {} },
        { id: 'theme', label: 'Toggle theme', group: 'View', onSelect: () => {} },
      ],
    },
  },
};

export default seeds;

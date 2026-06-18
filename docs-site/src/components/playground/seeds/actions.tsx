import { ButtonGroup, Button, SplitButton, ToggleGroup } from '@koduhai/design-system';
import type { Seed } from './types';

const SPLIT_BUTTON_ITEMS = [
  { label: 'Save as…', onSelect: () => {} },
  { label: 'Save a copy', onSelect: () => {} },
];

const TOGGLE_GROUP_ITEMS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board' },
];

// Playground seeds for Actions components. Add: Name: { Component, props?, children? }.
const seeds: Record<string, Seed> = {
  ButtonGroup: {
    Component: ButtonGroup,
    props: {
      'aria-label': 'View',
      children: (
        <>
          <Button tone="primary">Day</Button>
          <Button tone="primary">Week</Button>
          <Button tone="primary">Month</Button>
        </>
      ),
    },
  },
  SplitButton: {
    Component: SplitButton,
    props: {
      items: SPLIT_BUTTON_ITEMS,
      tone: 'primary',
    },
    children: 'Save',
  },
  ToggleGroup: {
    Component: ToggleGroup,
    props: {
      type: 'single',
      items: TOGGLE_GROUP_ITEMS,
      value: 'list',
      'aria-label': 'View mode',
    },
  },
};

export default seeds;

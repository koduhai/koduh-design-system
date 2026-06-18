// Curated seeds for the first wave of playground components.
import {
  Button,
  LoadingButton,
  Chip,
  Alert,
  Banner,
  StatusBadge,
  Avatar,
  Progress,
  Meter,
  Spinner,
  Skeleton,
  Switch,
  Checkbox,
  Slider,
  Link,
  Text,
  Heading,
  Kbd,
  Code,
  Stat,
  EmptyState,
  Divider,
} from '@koduhai/design-system';
import type { Seed } from './types';

const seeds: Record<string, Seed> = {
  Button: { Component: Button, children: 'Click me' },
  LoadingButton: { Component: LoadingButton, props: { loading: false }, children: 'Save' },
  Chip: { Component: Chip, props: { label: 'Chip label', tone: 'primary' } },
  Alert: {
    Component: Alert,
    props: { severity: 'info', title: 'Heads up' },
    children: 'A short, supporting alert message.',
  },
  Banner: {
    Component: Banner,
    props: { severity: 'info' },
    children: 'A page-level banner message.',
  },
  StatusBadge: { Component: StatusBadge, props: { status: 'active', label: 'Active' } },
  Avatar: { Component: Avatar, props: { name: 'Ada Lovelace' } },
  Progress: { Component: Progress, props: { value: 60, tone: 'primary' } },
  Meter: { Component: Meter, props: { value: 60, max: 100, low: 33, high: 66, label: 'Storage' } },
  Spinner: { Component: Spinner, props: {} },
  Skeleton: { Component: Skeleton, props: { width: 220, height: 16 } },
  Switch: { Component: Switch, props: { label: 'Enable notifications', checked: false } },
  Checkbox: { Component: Checkbox, props: { label: 'Accept terms', checked: false } },
  Slider: { Component: Slider, props: { value: 40, label: 'Volume' } },
  Link: { Component: Link, props: { href: '#' }, children: 'Visit the docs' },
  Text: { Component: Text, children: 'The quick brown fox jumps over the lazy dog.' },
  Heading: { Component: Heading, props: { level: 2 }, children: 'Section heading' },
  Kbd: { Component: Kbd, children: 'Ctrl' },
  Code: { Component: Code, children: 'npm install @koduhai/design-system' },
  Stat: {
    Component: Stat,
    props: { label: 'Revenue', value: '$12,400', delta: '+12%', trend: 'up' },
  },
  EmptyState: {
    Component: EmptyState,
    props: { title: 'No results', description: 'Try adjusting your filters.' },
  },
  Divider: { Component: Divider, props: {} },
};

export default seeds;

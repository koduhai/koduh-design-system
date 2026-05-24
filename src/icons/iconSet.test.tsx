import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import * as icons from './icons';
import type { IconProps } from './createIcon';

// The app-nav icons added so a typical app shell (sidebar/topbar) can be built
// from the built-in set without hand-rolling inline SVG. createIcon covers
// anything beyond this; see Icons.stories.tsx.
const APP_NAV_ICONS = [
  'DashboardIcon',
  'ListIcon',
  'ActivityIcon',
  'BotIcon',
  'SettingsIcon',
  'ChartIcon',
  'HomeIcon',
  'BellIcon',
  'PlusIcon',
  'ChevronRightIcon',
  'ChevronLeftIcon',
  'ChevronUpIcon',
  'MoreVerticalIcon',
  'LogOutIcon',
] as const;

const registry = icons as unknown as Record<string, ComponentType<IconProps> | undefined>;

describe('app-nav icon set', () => {
  it.each(APP_NAV_ICONS)('exports %s as a labelable icon', (name) => {
    const Icon = registry[name];
    expect(Icon, `${name} should be exported`).toBeDefined();
    const Resolved = Icon!;
    const { container } = render(<Resolved title={name} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // title set => exposed as an image with an accessible name.
    expect(svg).toHaveAttribute('role', 'img');
    expect(container.querySelector('title')?.textContent).toBe(name);
  });
});

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CloseIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  InfoIcon,
  WarningIcon,
  ErrorIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
  HomeIcon,
  DashboardIcon,
  ListIcon,
  ActivityIcon,
  ChartIcon,
  BotIcon,
  SettingsIcon,
  BellIcon,
  PlusIcon,
  MoreVerticalIcon,
  LogOutIcon,
} from './icons';
import { createIcon } from './createIcon';
import type { ComponentType } from 'react';
import type { IconProps } from './createIcon';

const meta: Meta = {
  title: 'Foundations/Icons',
};
export default meta;

type Story = StoryObj;

const ALL: [string, ComponentType<IconProps>][] = [
  ['Close', CloseIcon],
  ['ChevronDown', ChevronDownIcon],
  ['ChevronUp', ChevronUpIcon],
  ['ChevronLeft', ChevronLeftIcon],
  ['ChevronRight', ChevronRightIcon],
  ['Check', CheckIcon],
  ['Info', InfoIcon],
  ['Warning', WarningIcon],
  ['Error', ErrorIcon],
  ['Menu', MenuIcon],
  ['Search', SearchIcon],
  ['User', UserIcon],
  ['Home', HomeIcon],
  ['Dashboard', DashboardIcon],
  ['List', ListIcon],
  ['Activity', ActivityIcon],
  ['Chart', ChartIcon],
  ['Bot', BotIcon],
  ['Settings', SettingsIcon],
  ['Bell', BellIcon],
  ['Plus', PlusIcon],
  ['MoreVertical', MoreVerticalIcon],
  ['LogOut', LogOutIcon],
];

export const Gallery: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
        gap: 16,
        color: 'var(--ku-color-text-primary)',
        fontFamily: 'var(--ku-font-family-base)',
      }}
    >
      {ALL.map(([name, Icon]) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 12,
          }}
        >
          <Icon title={name} />
          <span style={{ fontSize: 12, color: 'var(--ku-color-text-secondary)' }}>{name}</span>
        </div>
      ))}
    </div>
  ),
};

// Need an icon that isn't in the built-in set? Build one from raw 24×24 SVG
// path content with `createIcon` — the same factory the built-ins use. Pass a
// `title` to expose it as a labelled image; omit it for a decorative icon.
const RocketIcon = createIcon(
  'RocketIcon',
  <path d="M14 3c3 1 5 4 5 8 0 1-.2 2-.5 3l-2.5 2.5-3-3 3-3-3-3 3-3a8 8 0 0 0-1-.5M9.5 14.5l-3-3L4 14c-1 1-1 5-1 5s4 0 5-1z" />,
);

export const CreateYourOwn: Story = {
  name: 'createIcon (extend the set)',
  render: () => (
    <div style={{ color: 'var(--ku-color-text-primary)' }}>
      <RocketIcon title="Rocket" size={48} />
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sidebar } from './Sidebar';
import type { SidebarItem } from './Sidebar';
import { UserIcon, SearchIcon, MenuIcon } from '../../icons';

const items: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: <MenuIcon size={18} />, href: '#home', active: true },
  { id: 'search', label: 'Search', icon: <SearchIcon size={18} />, href: '#search' },
  { id: 'profile', label: 'Profile', icon: <UserIcon size={18} />, href: '#profile' },
  { id: 'disabled', label: 'Disabled', icon: <UserIcon size={18} />, href: '#x', disabled: true },
];

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
} satisfies Meta<typeof Sidebar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { items },
  render: (args) => (
    <div style={{ height: 360, display: 'flex' }}>
      <Sidebar {...args} />
    </div>
  ),
};

export const Showcase: Story = {
  args: { items },
  // Two <nav> landmarks must have UNIQUE accessible names, or axe flags
  // "landmark-unique". Give each a distinct aria-label.
  render: () => (
    <div style={{ display: 'flex', gap: 24, height: 360 }}>
      <Sidebar
        items={items}
        aria-label="Primary"
        header={<strong>Koduh</strong>}
        footer={<small>v1.0</small>}
      />
      <Sidebar
        items={items}
        aria-label="Collapsed example"
        defaultCollapsed
        header={<strong>K</strong>}
      />
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { CloseIcon, CheckIcon, InfoIcon, WarningIcon, ErrorIcon, MenuIcon, SearchIcon, UserIcon } from './icons';

const meta: Meta = {
  title: 'Foundations/Icons',
};
export default meta;

type Story = StoryObj;

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, color: 'var(--ku-color-text-primary)' }}>
      <CloseIcon title="Close" />
      <CheckIcon title="Check" />
      <InfoIcon title="Info" />
      <WarningIcon title="Warning" />
      <ErrorIcon title="Error" />
      <MenuIcon title="Menu" />
      <SearchIcon title="Search" />
      <UserIcon title="User" />
    </div>
  ),
};

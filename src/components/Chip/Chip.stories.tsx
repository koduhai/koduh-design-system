import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';

const meta = {
  title: 'Components/Chip',
  component: Chip,
} satisfies Meta<typeof Chip>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Chip' } };

export const Showcase: Story = {
  args: { label: 'Chip' },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Chip label="Solid" tone="primary" />
      <Chip label="Neutral" />
      <Chip label="Outline" variant="outline" />
      <Chip label="Success" tone="success" />
      <Chip label="Warning" tone="warning" />
      <Chip label="Danger" tone="danger" />
      <Chip label="Info" tone="info" />
      <Chip label="Accent" tone="accent" />
      <Chip label="Clickable" onClick={() => {}} tone="primary" />
      <Chip label="Apple" onDelete={() => {}} />
      <Chip label="Small" size="sm" />
    </div>
  ),
};

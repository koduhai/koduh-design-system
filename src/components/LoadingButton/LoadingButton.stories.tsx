import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingButton } from './LoadingButton';

const meta = {
  title: 'Components/LoadingButton',
  component: LoadingButton,
} satisfies Meta<typeof LoadingButton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Save' } };

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <LoadingButton>Idle</LoadingButton>
      <LoadingButton loading loadingText="Saving…">Saving</LoadingButton>
      <LoadingButton loading tone="danger" loadingText="Deleting…">Deleting</LoadingButton>
    </div>
  ),
};

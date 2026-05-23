import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
} satisfies Meta<typeof Alert>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { severity: 'info', title: 'Heads up', children: 'This is an informational message.' },
};

export const Showcase: Story = {
  args: { severity: 'info', children: 'Message' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <Alert severity="info" title="Information">
        A neutral, informational message.
      </Alert>
      <Alert severity="success" title="Success">
        Your changes were saved.
      </Alert>
      <Alert severity="warning" title="Warning">
        This action may have side effects.
      </Alert>
      <Alert severity="error" title="Error">
        Something went wrong.
      </Alert>
      <Alert severity="info">An alert without a title.</Alert>
      <Alert severity="warning" title="Dismissible" closable onClose={() => {}}>
        This alert can be dismissed.
      </Alert>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner } from './Banner';
import { Button } from '../Button';

const meta = {
  title: 'Components/Banner',
  component: Banner,
} satisfies Meta<typeof Banner>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { severity: 'info', children: 'A new version of the app is available.' },
};

export const Showcase: Story = {
  args: { severity: 'info', children: 'Message' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Banner severity="info">A neutral, informational notice.</Banner>
      <Banner severity="success">Your changes were published.</Banner>
      <Banner severity="warning">Your trial ends in 3 days.</Banner>
      <Banner severity="error">We could not reach the server.</Banner>
      <Banner
        severity="info"
        title="Maintenance scheduled"
        action={
          <Button size="sm" variant="outline" tone="primary">
            Learn more
          </Button>
        }
      >
        Service will be unavailable on Sunday from 2–4am UTC.
      </Banner>
      <Banner severity="warning" dismissable onClose={() => {}}>
        This banner can be dismissed.
      </Banner>
    </div>
  ),
};

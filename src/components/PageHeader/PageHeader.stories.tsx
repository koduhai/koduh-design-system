import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageHeader } from './PageHeader';
import { Button } from '../Button';

const meta = {
  title: 'Components/PageHeader',
  component: PageHeader,
} satisfies Meta<typeof PageHeader>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: 'Dashboard', subtitle: 'Welcome back, Ada.' },
};

export const Showcase: Story = {
  args: { title: 'Project Atlas' },
  render: () => (
    <div style={{ minWidth: 480 }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '#a' },
          { label: 'Projects', href: '#b' },
          { label: 'Project Atlas' },
        ]}
        title="Project Atlas"
        subtitle="Last updated 2 hours ago"
        actions={
          <>
            <Button variant="outline" tone="neutral">
              Settings
            </Button>
            <Button>New item</Button>
          </>
        }
      />
    </div>
  ),
};

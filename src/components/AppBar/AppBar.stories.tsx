import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppBar } from './AppBar';
import { Button } from '../Button';
import { Avatar } from '../Avatar';

const meta = {
  title: 'Components/AppBar',
  component: AppBar,
} satisfies Meta<typeof AppBar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { title: 'Koduh AI' } };

export const Showcase: Story = {
  args: { title: 'Koduh AI' },
  // Each AppBar is wrapped in a labeled <section> so its <header> is NOT a
  // top-level `banner` landmark — otherwise two AppBars would trip axe's
  // "landmark-no-duplicate-banner" rule in the story fragment.
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 600 }}>
      <section aria-label="With actions">
        <AppBar
          title="Koduh AI"
          actions={
            <>
              <Button variant="ghost" tone="neutral">
                Docs
              </Button>
              <Avatar name="Ada Lovelace" size="sm" />
            </>
          }
        />
      </section>
      <section aria-label="No elevation">
        <AppBar title="No elevation" elevation={false} actions={<Button size="sm">New</Button>} />
      </section>
    </div>
  ),
};

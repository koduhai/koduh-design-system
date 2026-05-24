import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from './Link';

const meta = {
  title: 'Components/Link',
  component: Link,
} satisfies Meta<typeof Link>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { href: '#', children: 'a link' } };

export const Showcase: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 480,
        color: 'var(--ku-color-text-primary)',
      }}
    >
      {/* Links inside running text use the default persistent underline, so they
          stay distinguishable without relying on color (WCAG link-in-text-block). */}
      <p>
        Read the{' '}
        <Link href="#" tone="primary">
          getting started guide
        </Link>{' '}
        and our{' '}
        <Link href="#" tone="neutral">
          terms of service
        </Link>{' '}
        before you begin.
      </p>
      {/* Standalone links (nav/list contexts), not embedded in prose, may use
          hover/none underline — shown as their own elements, not within a sentence. */}
      <nav aria-label="Example navigation" style={{ display: 'flex', gap: 20 }}>
        <Link href="#" underline="hover">
          Dashboard
        </Link>
        <Link href="#" underline="hover" tone="neutral">
          Settings
        </Link>
        <Link href="#" underline="none">
          Help
        </Link>
      </nav>
    </div>
  ),
};

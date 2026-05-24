import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from './Breadcrumbs';

const meta = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
} satisfies Meta<typeof Breadcrumbs>;
export default meta;

type Story = StoryObj<typeof meta>;

const trail = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Data', href: '/library/data' },
  { label: 'Current' },
];

export const Default: Story = { args: { items: trail } };

export const Showcase: Story = {
  args: { items: trail },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Breadcrumbs
        aria-label="Breadcrumb: short trail"
        items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]}
      />
      <Breadcrumbs
        aria-label="Breadcrumb: custom separator"
        items={trail}
        separator={<span>/</span>}
      />
      <Breadcrumbs aria-label="Breadcrumb: collapsed" items={trail} maxItems={3} />
    </div>
  ),
};

/**
 * **Nested-route pattern.** Don't render `<Breadcrumbs>` in both a layout shell
 * and the page (that double-nests the nav landmark). Instead let the shell own a
 * base trail and have each page contribute its tail; pass the **combined**
 * `items[]` to a single surface — either one `<Breadcrumbs>` or
 * `PageHeader.breadcrumbs={items}` (which renders one `<Breadcrumbs>` internally).
 * For a route like `/agents/:id`, the page supplies the full trail below.
 */
export const NestedRoute: Story = {
  args: { items: trail },
  render: () => {
    const base = [
      { label: 'Home', href: '/' },
      { label: 'Agents', href: '/agents' },
    ];
    const pageTail = [{ label: 'Atlas Agent' }]; // current route segment, no href
    return <Breadcrumbs items={[...base, ...pageTail]} />;
  },
};

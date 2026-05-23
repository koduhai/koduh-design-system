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

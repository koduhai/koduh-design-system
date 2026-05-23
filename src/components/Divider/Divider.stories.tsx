import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';

const meta = {
  title: 'Components/Divider',
  component: Divider,
} satisfies Meta<typeof Divider>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <p style={{ margin: '0 0 12px' }}>Above the divider</p>
      <Divider />
      <p style={{ margin: '12px 0 0' }}>Below the divider</p>
    </div>
  ),
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 420 }}>
      {/* Horizontal separator */}
      <section>
        <p style={{ margin: '0 0 8px' }}>Horizontal</p>
        <Divider />
      </section>

      {/* Vertical divider between inline items */}
      <section>
        <p style={{ margin: '0 0 8px' }}>Vertical between items</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 24 }}>
          <span>Profile</span>
          <Divider orientation="vertical" />
          <span>Settings</span>
          <Divider orientation="vertical" />
          <span>Logout</span>
        </div>
      </section>

      {/* Labelled (decorative) divider */}
      <section>
        <p style={{ margin: '0 0 8px' }}>With a label</p>
        <Divider>OR</Divider>
      </section>

      {/* Inset variant */}
      <section>
        <p style={{ margin: '0 0 8px' }}>Inset</p>
        <Divider inset />
      </section>
    </div>
  ),
};

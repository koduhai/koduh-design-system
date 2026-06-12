import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Card content', style: { maxWidth: 320 } },
};

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <Card variant="outline" style={{ width: 200 }}>
        Outline
      </Card>
      <Card variant="elevated" style={{ width: 200 }}>
        Elevated
      </Card>
      <Card variant="flat" style={{ width: 200 }}>
        Flat
      </Card>
      <Card variant="outline" padding="lg" style={{ width: 200 }}>
        Large padding
      </Card>
    </div>
  ),
};

/**
 * Header / Body / Footer slots. Use `padding="none"` on the outer Card so each
 * slot owns its own padding; Header gets a bottom divider and Footer a top one.
 */
export const Slots: Story = {
  render: () => (
    <Card variant="elevated" padding="none" style={{ maxWidth: 360 }}>
      <Card.Header>
        <strong>Card title</strong>
      </Card.Header>
      <Card.Body>
        Body content sits in the padded region between the header and footer dividers.
      </Card.Body>
      <Card.Footer
        style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
      >
        <button type="button">Cancel</button>
        <button type="button">Save</button>
      </Card.Footer>
    </Card>
  ),
};

/** Header + Body only — the bordered-header / padded-body pattern the consumer uses. */
export const HeaderAndBody: Story = {
  render: () => (
    <Card variant="outline" padding="none" style={{ maxWidth: 360 }}>
      <Card.Header>
        <strong>Settings</strong>
      </Card.Header>
      <Card.Body>Configure your preferences here.</Card.Body>
    </Card>
  ),
};

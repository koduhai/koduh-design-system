import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
} satisfies Meta<typeof Textarea>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Bio', helperText: 'A short description.' } };

export const Showcase: Story = {
  args: { label: 'Bio' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 420 }}>
      <Textarea label="Default" helperText="A short description." />
      <Textarea label="Required" required defaultValue="Some text" />
      <Textarea label="With error" error errorText="This field is required." />
      <Textarea
        label="Auto-resize"
        autoResize
        minRows={2}
        maxRows={6}
        defaultValue={'Line one\nLine two'}
      />
      <Textarea label="Small" size="sm" />
    </div>
  ),
};

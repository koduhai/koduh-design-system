import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagInput } from './TagInput';

const meta = {
  title: 'Components/TagInput',
  component: TagInput,
} satisfies Meta<typeof TagInput>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Tags', defaultValue: ['react', 'typescript'], placeholder: 'Add a tag…' },
};

export const Showcase: Story = {
  args: { label: 'Tags' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <TagInput
        label="Skills"
        defaultValue={['react', 'typescript', 'css']}
        helperText="Press Enter or comma to add."
      />
      <TagInput label="Topics" placeholder="Type a topic and press Enter" />
      <TagInput
        label="Recipients"
        defaultValue={['a@example.com']}
        error
        errorText="At least one recipient is required."
      />
    </div>
  ),
};

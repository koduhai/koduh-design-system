import type { Meta, StoryObj } from '@storybook/react-vite';
import { SplitButton } from './SplitButton';

const meta = {
  title: 'Components/SplitButton',
  component: SplitButton,
} satisfies Meta<typeof SplitButton>;
export default meta;

type Story = StoryObj<typeof meta>;

const items = [
  { label: 'Save as…', onSelect: () => {} },
  { label: 'Save a copy', onSelect: () => {} },
];

export const Default: Story = {
  args: {
    children: 'Save',
    onClick: () => {},
    items,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Save',
    disabled: true,
    onClick: () => {},
    items,
  },
};

export const Tones: Story = {
  args: { children: null, items },
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <SplitButton onClick={() => {}} items={items} tone="primary">
        Primary
      </SplitButton>
      <SplitButton onClick={() => {}} items={items} tone="neutral" variant="outline">
        Outline
      </SplitButton>
      <SplitButton onClick={() => {}} items={items} tone="danger">
        Danger
      </SplitButton>
    </div>
  ),
};

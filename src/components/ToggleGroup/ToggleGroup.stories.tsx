import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ToggleGroup } from './ToggleGroup';

const meta = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
} satisfies Meta<typeof ToggleGroup>;
export default meta;

type Story = StoryObj<typeof meta>;

const VIEW_ITEMS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board' },
];

export const Default: Story = {
  args: { type: 'single', items: VIEW_ITEMS, defaultValue: 'list' },
};

export const Showcase: Story = {
  args: { items: VIEW_ITEMS },
  render: () => {
    const [single, setSingle] = useState<string>('list');
    const [multi, setMulti] = useState<string[]>(['bold']);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ToggleGroup
          type="single"
          items={VIEW_ITEMS}
          value={single}
          onChange={(v) => setSingle(v as string)}
        />
        <ToggleGroup
          type="single"
          tone="neutral"
          size="sm"
          items={VIEW_ITEMS}
          defaultValue="grid"
        />
        <ToggleGroup
          type="multiple"
          size="lg"
          items={[
            { value: 'bold', label: 'B' },
            { value: 'italic', label: 'I' },
            { value: 'underline', label: 'U' },
          ]}
          value={multi}
          onChange={(v) => setMulti(v as string[])}
        />
      </div>
    );
  },
};

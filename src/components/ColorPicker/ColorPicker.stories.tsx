import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { FormField } from '../FormField';
import { Popover } from '../Popover';
import { Button } from '../Button';

const meta = {
  title: 'Components/ColorPicker',
  component: ColorPicker,
} satisfies Meta<typeof ColorPicker>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Brand color', defaultValue: '#1B5FCC' },
};

export const WithAlpha: Story = {
  args: { label: 'Overlay tint', defaultValue: '#1B5FCC', alpha: true },
};

export const CustomSwatches: Story = {
  args: {
    label: 'Theme accent',
    defaultValue: '#7C3AED',
    swatches: ['#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#0891B2', '#4F46E5'],
  },
};

export const InsideFormField: Story = {
  render: () => (
    <FormField label="Highlight color" helperText="Used for selected rows.">
      <ColorPicker defaultValue="#1B7F3B" />
    </FormField>
  ),
};

/** Compose-it-yourself: drop the picker into a Popover triggered by a swatch button. */
export const InPopover: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [color, setColor] = useState('#C62828');
    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={
          <Button variant="outline" tone="neutral">
            <span
              style={{
                display: 'inline-block',
                inlineSize: 16,
                blockSize: 16,
                borderRadius: 4,
                background: color,
                marginInlineEnd: 8,
                verticalAlign: 'middle',
              }}
            />
            {color}
          </Button>
        }
      >
        <ColorPicker value={color} onChange={setColor} />
      </Popover>
    );
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { Button } from '../Button';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
} satisfies Meta<typeof Tooltip>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { content: 'Saves your work', children: <Button>Save</Button> },
  render: (args) => (
    <div style={{ padding: 80 }}>
      <Tooltip {...args} />
    </div>
  ),
};

export const Showcase: Story = {
  args: { content: 'Tooltip', children: <Button>Trigger</Button> },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ padding: 120 }}>
      <Tooltip content="This tooltip describes the button." delay={0}>
        <Button autoFocus>Focus shows tooltip</Button>
      </Tooltip>
    </div>
  ),
};

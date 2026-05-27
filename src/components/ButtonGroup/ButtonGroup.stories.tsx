import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup } from './ButtonGroup';
import { Button } from '../Button';

const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
} satisfies Meta<typeof ButtonGroup>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: { children: null },
  render: () => (
    <ButtonGroup aria-label="Text alignment">
      <Button variant="outline" tone="neutral">
        Left
      </Button>
      <Button variant="outline" tone="neutral">
        Center
      </Button>
      <Button variant="outline" tone="neutral">
        Right
      </Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  args: { children: null },
  render: () => (
    <ButtonGroup orientation="vertical" aria-label="Actions">
      <Button variant="outline" tone="neutral">
        First
      </Button>
      <Button variant="outline" tone="neutral">
        Second
      </Button>
      <Button variant="outline" tone="neutral">
        Third
      </Button>
    </ButtonGroup>
  ),
};

export const Solid: Story = {
  args: { children: null },
  render: () => (
    <ButtonGroup aria-label="View">
      <Button tone="primary">Day</Button>
      <Button tone="primary">Week</Button>
      <Button tone="primary">Month</Button>
    </ButtonGroup>
  ),
};

export const Showcase: Story = {
  args: { children: null },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <ButtonGroup aria-label="Text alignment">
        <Button variant="outline" tone="neutral">
          Left
        </Button>
        <Button variant="outline" tone="neutral">
          Center
        </Button>
        <Button variant="outline" tone="neutral">
          Right
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="View">
        <Button tone="primary">Day</Button>
        <Button tone="primary">Week</Button>
        <Button tone="primary">Month</Button>
      </ButtonGroup>
      <ButtonGroup orientation="vertical" aria-label="Actions">
        <Button variant="outline" tone="neutral">
          First
        </Button>
        <Button variant="outline" tone="neutral">
          Second
        </Button>
      </ButtonGroup>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState';
import { Button } from '../Button';
import { SearchIcon } from '../../icons';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
};

export const Showcase: Story = {
  args: { title: 'No results found' },
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <EmptyState
        icon={<SearchIcon size={40} />}
        title="No results found"
        description="We couldn't find anything matching your search. Try a different term."
        action={<Button>Clear filters</Button>}
      />
    </div>
  ),
};

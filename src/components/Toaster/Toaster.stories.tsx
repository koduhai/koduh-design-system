import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toaster } from './Toaster';
import { useToast } from './useToast';
import { __resetToasts, addToast } from './store';
import { Button } from '../Button';

const meta = {
  title: 'Components/Toaster',
  component: Toaster,
} satisfies Meta<typeof Toaster>;
export default meta;

type Story = StoryObj<typeof meta>;

// On mount, clears the singleton store and enqueues one persistent toast per
// severity (duration: Infinity) so all four stay visible for axe + visual
// capture. Each gets a distinct title.
function ShowcaseDemo() {
  useEffect(() => {
    __resetToasts();
    addToast({
      severity: 'info',
      title: 'Heads up',
      description: 'A new version is available.',
      duration: Infinity,
    });
    addToast({
      severity: 'success',
      title: 'Saved',
      description: 'Your changes were saved.',
      duration: Infinity,
    });
    addToast({
      severity: 'warning',
      title: 'Storage low',
      description: 'You are running out of space.',
      duration: Infinity,
    });
    addToast({
      severity: 'error',
      title: 'Upload failed',
      description: 'The file could not be uploaded.',
      duration: Infinity,
    });
    return () => {
      __resetToasts();
    };
  }, []);
  return <Toaster placement="bottom-right" />;
}

export const Showcase: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <ShowcaseDemo />,
};

// Interactive: buttons fire each severity via the useToast shortcuts.
function PlaygroundDemo() {
  const { toast } = useToast();
  useEffect(() => {
    __resetToasts();
    return () => {
      __resetToasts();
    };
  }, []);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 24 }}>
      <Button onClick={() => toast.info('A new version is available.', { title: 'Heads up' })}>
        Info
      </Button>
      <Button
        tone="success"
        onClick={() => toast.success('Your changes were saved.', { title: 'Saved' })}
      >
        Success
      </Button>
      <Button
        tone="warning"
        onClick={() => toast.warning('You are running out of space.', { title: 'Storage low' })}
      >
        Warning
      </Button>
      <Button
        tone="danger"
        onClick={() => toast.error('The file could not be uploaded.', { title: 'Upload failed' })}
      >
        Error
      </Button>
      <Toaster placement="bottom-right" />
    </div>
  );
}

export const Playground: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <PlaygroundDemo />,
};

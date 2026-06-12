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

// Drives a single toast through a promise's lifecycle: loading → success/error.
// Note: `const { toast } = useToast()` collides with the `toast` you may have
// imported from elsewhere (or a local variable named `toast`). If that bites
// you, alias the destructure — `const { toast: showToast } = useToast()` — and
// call `showToast.promise(...)`.
function PromiseDemo() {
  const { toast } = useToast();
  useEffect(() => {
    __resetToasts();
    return () => {
      __resetToasts();
    };
  }, []);
  const run = (ok: boolean) =>
    toast.promise(
      // `globalThis.Promise` because this story is named `Promise`, which shadows
      // the global constructor inside this module.
      new globalThis.Promise<string>((resolve, reject) =>
        setTimeout(() => (ok ? resolve('report.pdf') : reject(new Error('network'))), 1500),
      ),
      {
        loading: 'Uploading…',
        success: (name) => `Uploaded ${name}`,
        error: (err) => `Upload failed: ${(err as Error).message}`,
      },
    );
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 24 }}>
      <Button onClick={() => run(true)}>Upload (resolves)</Button>
      <Button tone="danger" onClick={() => run(false)}>
        Upload (rejects)
      </Button>
      <Toaster placement="bottom-right" />
    </div>
  );
}

export const Promise: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <PromiseDemo />,
};

// Re-using the same caller-supplied `id` upserts the existing toast in place
// instead of stacking a new one — handy for progress/status that updates.
function DedupeByIdDemo() {
  const { toast } = useToast();
  useEffect(() => {
    __resetToasts();
    return () => {
      __resetToasts();
    };
  }, []);
  const save = () => {
    toast({ id: 'save', description: 'Saving…' });
    setTimeout(
      () => toast({ id: 'save', severity: 'success', description: 'Saved', duration: 2000 }),
      1200,
    );
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 24 }}>
      <Button onClick={save}>Save (upserts one toast)</Button>
      <Toaster placement="bottom-right" />
    </div>
  );
}

export const DedupeById: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <DedupeByIdDemo />,
};

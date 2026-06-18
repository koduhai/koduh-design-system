import { Toaster, useToast, Button } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

function Basic() {
  const { toast } = useToast();
  return (
    <>
      <div style={row}>
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
      </div>
      <Toaster placement="bottom-right" />
    </>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Fire toasts via the useToast() hook">
        <Basic />
      </DemoBlock>
    </Demos>
  );
}

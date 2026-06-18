import { useState } from 'react';
import { Snackbar, Button } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

type Severity = 'info' | 'success' | 'warning' | 'error';

function Basic() {
  const [severity, setSeverity] = useState<Severity | null>(null);
  return (
    <>
      <div style={row}>
        <Button onClick={() => setSeverity('info')}>Info</Button>
        <Button tone="success" onClick={() => setSeverity('success')}>
          Success
        </Button>
        <Button tone="warning" onClick={() => setSeverity('warning')}>
          Warning
        </Button>
        <Button tone="danger" onClick={() => setSeverity('error')}>
          Error
        </Button>
      </div>
      <Snackbar
        open={severity !== null}
        onOpenChange={() => setSeverity(null)}
        severity={severity ?? 'info'}
        autoHideDuration={4000}
        action={
          severity === 'error' ? (
            <Button size="sm" variant="ghost" tone="neutral" onClick={() => setSeverity(null)}>
              Retry
            </Button>
          ) : undefined
        }
      >
        This is a {severity} message.
      </Snackbar>
    </>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Snackbar by severity (auto-hides after 4s)">
        <Basic />
      </DemoBlock>
    </Demos>
  );
}

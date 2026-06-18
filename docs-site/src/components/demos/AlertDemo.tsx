import { useState } from 'react';
import { Alert } from '@koduhai/design-system';
import type { AlertSeverity } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

const severities: AlertSeverity[] = ['info', 'success', 'warning', 'error'];

function Dismissable() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ ...col, width: '100%' }}>
      {open ? (
        <Alert severity="info" title="Dismissable" dismissable onClose={() => setOpen(false)}>
          Close me with the × button.
        </Alert>
      ) : (
        <Alert severity="success" title="Dismissed">
          Reload the page to bring the dismissable alert back.
        </Alert>
      )}
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="severity: info · success · warning · error">
        <div style={{ ...col, width: '100%' }}>
          {severities.map((s) => (
            <Alert key={s} severity={s} title={s[0].toUpperCase() + s.slice(1)}>
              This is a {s} alert with a short supporting message.
            </Alert>
          ))}
        </div>
      </DemoBlock>
      <DemoBlock caption="dismissable + onClose">
        <Dismissable />
      </DemoBlock>
    </Demos>
  );
}

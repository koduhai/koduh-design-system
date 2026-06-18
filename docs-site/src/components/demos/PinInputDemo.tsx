import { useState } from 'react';
import { PinInput } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [code, setCode] = useState('');
  return <PinInput aria-label="One-time code" value={code} onChange={setCode} />;
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Six-digit code">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="Lengths & sizes">
        <div style={col}>
          <PinInput length={4} size="sm" aria-label="Four digits, small" />
          <PinInput length={6} size="lg" aria-label="Six digits, large" />
        </div>
      </DemoBlock>
      <DemoBlock caption="Text, masked, disabled">
        <div style={col}>
          <PinInput length={4} type="text" aria-label="Alphanumeric" defaultValue="ABCD" />
          <PinInput length={6} mask aria-label="Masked" defaultValue="123" />
          <PinInput length={4} disabled defaultValue="12" aria-label="Disabled" />
        </div>
      </DemoBlock>
    </Demos>
  );
}

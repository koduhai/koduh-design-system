import { useState } from 'react';
import { TextField } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [v, setV] = useState('');
  return (
    <div style={{ ...col, maxWidth: 360 }}>
      <TextField label="Email" placeholder="you@example.com" value={v} onChange={setV} />
      <TextField label="With helper" helperText="We never share your email." placeholder="Email" />
      <TextField label="Required" required placeholder="Required field" />
      <TextField label="Invalid" error errorText="This field is required." />
      <TextField label="With adornment" startAdornment="@" placeholder="username" />
    </div>
  );
}

function Sizes() {
  return (
    <div style={{ ...col, maxWidth: 360 }}>
      <TextField label="Small" size="sm" placeholder="sm" />
      <TextField label="Medium" size="md" placeholder="md" />
      <TextField label="Large" size="lg" placeholder="lg" />
      <TextField label="Compact density" density="compact" placeholder="compact" />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="States">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="Sizes & density">
        <Sizes />
      </DemoBlock>
    </Demos>
  );
}

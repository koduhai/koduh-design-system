import { useState } from 'react';
import { PasswordInput } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [v, setV] = useState('hunter2');
  return (
    <div style={{ ...col, maxWidth: 320 }}>
      <PasswordInput
        label="Password"
        value={v}
        onChange={setV}
        helperText="At least 8 characters."
      />
      <PasswordInput label="New password" placeholder="Enter a password" />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Toggle visibility">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="States">
        <div style={{ ...col, maxWidth: 320 }}>
          <PasswordInput
            label="Confirm"
            error
            errorText="Passwords don't match."
            defaultValue="x"
          />
          <PasswordInput label="Disabled" defaultValue="hunter2" disabled />
        </div>
      </DemoBlock>
    </Demos>
  );
}

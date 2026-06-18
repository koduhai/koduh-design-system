import { useState } from 'react';
import { Textarea } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [v, setV] = useState('');
  return (
    <div style={{ ...col, maxWidth: 420 }}>
      <Textarea
        label="Bio"
        helperText="A short description."
        value={v}
        onChange={setV}
        placeholder="Tell us about yourself"
      />
      <Textarea label="Required" required defaultValue="Some text" />
      <Textarea label="With error" error errorText="This field is required." />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="States">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="Auto-resize">
        <div style={{ ...col, maxWidth: 420 }}>
          <Textarea
            label="Auto-resize"
            autoResize
            minRows={2}
            maxRows={6}
            defaultValue={'Line one\nLine two'}
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}

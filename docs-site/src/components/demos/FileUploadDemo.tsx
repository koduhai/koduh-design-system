import { useState } from 'react';
import { FileUpload } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Single() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div style={col}>
      <FileUpload onFiles={(files) => setNames(files.map((f) => f.name))} />
      {names.length > 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ku-color-text-secondary)' }}>
          Selected: {names.join(', ')}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Single file: drag here or click to browse">
        <div style={{ maxWidth: 480 }}>
          <Single />
        </div>
      </DemoBlock>
      <DemoBlock caption="Multiple, with an accept filter">
        <div style={{ maxWidth: 480 }}>
          <FileUpload multiple accept="image/*,.pdf" onFiles={() => {}} />
        </div>
      </DemoBlock>
      <DemoBlock caption="Disabled">
        <div style={{ maxWidth: 480 }}>
          <FileUpload disabled onFiles={() => {}} />
        </div>
      </DemoBlock>
    </Demos>
  );
}

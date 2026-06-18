import { useState } from 'react';
import { LoadingButton } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

function Interactive() {
  const [loading, setLoading] = useState(false);
  return (
    <div style={row}>
      <LoadingButton
        loading={loading}
        loadingText="Saving…"
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 1600);
        }}
      >
        Save
      </LoadingButton>
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="idle · loading · loading (danger)">
        <div style={row}>
          <LoadingButton>Idle</LoadingButton>
          <LoadingButton loading loadingText="Saving…">
            Saving
          </LoadingButton>
          <LoadingButton loading tone="danger" loadingText="Deleting…">
            Deleting
          </LoadingButton>
        </div>
      </DemoBlock>
      <DemoBlock caption="Interactive: click to toggle loading">
        <Interactive />
      </DemoBlock>
    </Demos>
  );
}

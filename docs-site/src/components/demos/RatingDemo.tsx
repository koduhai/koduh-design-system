import { useState } from 'react';
import { Rating } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [v, setV] = useState(3);
  return <Rating value={v} onChange={setV} aria-label="Rate this product" />;
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Interactive">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="Sizes">
        <div style={col}>
          <Rating size="sm" defaultValue={3} aria-label="Small rating" />
          <Rating size="md" defaultValue={3} aria-label="Medium rating" />
          <Rating size="lg" defaultValue={3} aria-label="Large rating" />
        </div>
      </DemoBlock>
      <DemoBlock caption="Read-only & custom max">
        <div style={col}>
          <Rating value={4} readOnly aria-label="Average rating 4 of 5" />
          <Rating defaultValue={6} max={10} aria-label="Rating out of ten" />
        </div>
      </DemoBlock>
    </Demos>
  );
}

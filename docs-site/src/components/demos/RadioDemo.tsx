import { useState } from 'react';
import { Radio, RadioGroup } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

function Basic() {
  const [plan, setPlan] = useState('pro');
  return (
    <RadioGroup label="Plan" value={plan} onChange={setPlan}>
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
      <Radio value="team" label="Team" />
    </RadioGroup>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Vertical (default)">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="Horizontal">
        <RadioGroup label="Size" orientation="horizontal" defaultValue="m">
          <Radio value="s" label="Small" />
          <Radio value="m" label="Medium" />
          <Radio value="l" label="Large" />
        </RadioGroup>
      </DemoBlock>
      <DemoBlock caption="With a disabled option">
        <RadioGroup label="Availability" defaultValue="a">
          <Radio value="a" label="Available" />
          <Radio value="b" label="Also available" />
          <Radio value="c" label="Unavailable" disabled />
        </RadioGroup>
      </DemoBlock>
    </Demos>
  );
}

import { useState } from 'react';
import { Tabs } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const items = [
  { id: 'overview', label: 'Overview', content: 'Overview content goes here.' },
  { id: 'specs', label: 'Specs', content: 'Specifications content goes here.' },
  { id: 'reviews', label: 'Reviews', content: 'Reviews content goes here.' },
];

function Horizontal() {
  const [value, setValue] = useState('overview');
  return (
    <div style={{ maxWidth: 520 }}>
      <Tabs items={items} value={value} onChange={setValue} />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Horizontal (controlled)">
        <Horizontal />
      </DemoBlock>
      <DemoBlock caption="Vertical">
        <div style={{ maxWidth: 520 }}>
          <Tabs
            orientation="vertical"
            items={[
              { id: 'account', label: 'Account', content: 'Account settings.' },
              { id: 'security', label: 'Security', content: 'Security settings.' },
              { id: 'billing', label: 'Billing', content: 'Billing settings.' },
            ]}
          />
        </div>
      </DemoBlock>
      <DemoBlock caption="With a disabled tab">
        <div style={{ maxWidth: 520 }}>
          <Tabs
            items={[
              { id: 'active', label: 'Active', content: 'This tab is active.' },
              { id: 'disabled', label: 'Disabled', content: 'Disabled content.', disabled: true },
              { id: 'last', label: 'Last', content: 'Last tab content.' },
            ]}
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}

import { useState } from 'react';
import { Stepper } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const STEPS = [
  { label: 'Account', description: 'Create your credentials' },
  { label: 'Profile', description: 'Tell us about you' },
  { label: 'Billing', description: 'Add a payment method' },
  { label: 'Review', description: 'Confirm and finish' },
];

function Interactive() {
  const [active, setActive] = useState(2);
  return (
    <div style={{ maxWidth: 720 }}>
      <Stepper
        steps={STEPS}
        activeStep={active}
        onStepClick={setActive}
        aria-label="Interactive wizard"
      />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Horizontal">
        <div style={{ maxWidth: 720 }}>
          <Stepper steps={STEPS} activeStep={2} aria-label="Onboarding progress" />
        </div>
      </DemoBlock>
      <DemoBlock caption="Vertical">
        <Stepper steps={STEPS} activeStep={1} orientation="vertical" aria-label="Setup steps" />
      </DemoBlock>
      <DemoBlock caption="Interactive (click a visited step)">
        <Interactive />
      </DemoBlock>
    </Demos>
  );
}

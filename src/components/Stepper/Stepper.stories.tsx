import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stepper } from './Stepper';

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
} satisfies Meta<typeof Stepper>;
export default meta;

type Story = StoryObj<typeof meta>;

const STEPS = [
  { label: 'Account', description: 'Create your credentials' },
  { label: 'Profile', description: 'Tell us about you' },
  { label: 'Billing', description: 'Add a payment method' },
  { label: 'Review', description: 'Confirm and finish' },
];

export const Default: Story = {
  args: { steps: STEPS, activeStep: 1 },
};

export const Showcase: Story = {
  args: { steps: STEPS, activeStep: 1 },
  render: () => {
    const [active, setActive] = useState(2);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 720 }}>
        <section>
          <h3 style={{ margin: '0 0 16px' }}>Horizontal</h3>
          <Stepper steps={STEPS} activeStep={2} aria-label="Onboarding progress" />
        </section>

        <section>
          <h3 style={{ margin: '0 0 16px' }}>Vertical</h3>
          <Stepper steps={STEPS} activeStep={1} orientation="vertical" aria-label="Setup steps" />
        </section>

        <section>
          <h3 style={{ margin: '0 0 16px' }}>Interactive (click a visited step)</h3>
          <Stepper
            steps={STEPS}
            activeStep={active}
            onStepClick={setActive}
            aria-label="Interactive wizard"
          />
        </section>
      </div>
    );
  },
};

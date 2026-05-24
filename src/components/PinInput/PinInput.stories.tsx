import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { PinInput } from './PinInput';
import { FormField } from '../FormField';

const meta = {
  title: 'Components/PinInput',
  component: PinInput,
} satisfies Meta<typeof PinInput>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { length: 6, 'aria-label': 'One-time code' },
};

export const Showcase: Story = {
  args: { 'aria-label': 'Code' },
  render: () => {
    const [code, setCode] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <PinInput aria-label="Default (6, numeric)" value={code} onChange={setCode} />

        <PinInput length={4} size="sm" aria-label="Four digits, small" />
        <PinInput length={6} size="lg" aria-label="Six digits, large" />

        <PinInput length={4} type="text" aria-label="Alphanumeric" defaultValue="ABCD" />
        <PinInput length={6} mask aria-label="Masked" defaultValue="123" />
        <PinInput length={4} disabled defaultValue="12" aria-label="Disabled" />

        <FormField label="Verification code" helperText="Enter the 6-digit code we sent you">
          <PinInput length={6} />
        </FormField>

        <FormField label="With error" error errorText="That code is incorrect">
          <PinInput length={6} defaultValue="000000" />
        </FormField>
      </div>
    );
  },
};

import { FormField, TextField } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="FormField supplies the label, helper text and aria wiring to its control">
        <div style={{ ...col, maxWidth: 360 }}>
          <FormField label="Email address" helperText="We never share it.">
            <TextField type="email" placeholder="you@example.com" />
          </FormField>
        </div>
      </DemoBlock>
      <DemoBlock caption="Required and error states">
        <div style={{ ...col, maxWidth: 360 }}>
          <FormField label="Display name" required>
            <TextField placeholder="Required field" />
          </FormField>
          <FormField label="Age" error errorText="Please enter a valid age.">
            <TextField placeholder="0" />
          </FormField>
        </div>
      </DemoBlock>
    </Demos>
  );
}

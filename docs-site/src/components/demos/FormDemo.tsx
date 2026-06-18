import {
  Form,
  FormField,
  FormErrorSummary,
  TextField,
  Button,
  useForm,
  standardSchemaResolver,
} from '@koduhai/design-system';
import type { StandardSchemaV1 } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

// A tiny Standard-Schema validator that requires the listed fields.
const requireFields = (names: string[]): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'demo',
    validate(value) {
      const v = (value ?? {}) as Record<string, unknown>;
      const issues = names
        .filter((n) => !v[n])
        .map((n) => ({ message: `${n} is required`, path: [n] }));
      return issues.length ? { issues } : { value: v };
    },
  },
});

function LoginForm() {
  const form = useForm({
    resolver: standardSchemaResolver(requireFields(['email', 'password'])),
  });
  return (
    <Form form={form} onValid={(values) => console.log('Submitted', values)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ku-space-4)' }}>
        <FormErrorSummary />
        <FormField name="email" label="Email" required>
          <TextField type="email" placeholder="you@example.com" />
        </FormField>
        <FormField name="password" label="Password" required>
          <TextField type="password" placeholder="••••••••" />
        </FormField>
        <Button type="submit" variant="solid" tone="primary">
          Sign in
        </Button>
      </div>
    </Form>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Submit empty to see validation + the error summary wire up">
        <div style={{ maxWidth: 360 }}>
          <LoginForm />
        </div>
      </DemoBlock>
    </Demos>
  );
}

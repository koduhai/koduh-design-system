import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from './Form';
import { useForm, createFormStore } from './useForm';
import { useFieldArray } from './useFieldArray';
import { standardSchemaResolver } from './resolver';
import type { StandardSchemaV1 } from './resolver';
import { FormErrorSummary } from './FormErrorSummary';
import { FormField } from '../FormField';
import { TextField } from '../TextField';
import { Button } from '../Button';

const meta = {
  title: 'Components/Form',
  component: Form,
} satisfies Meta<typeof Form>;
export default meta;

type Story = StoryObj<typeof meta>;

// Stable placeholder form instance used only to satisfy the args type requirement
// for stories whose render function creates its own form via useForm().
const _placeholderForm = createFormStore();

// ---------------------------------------------------------------------------
// Schema helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Login story
// ---------------------------------------------------------------------------

export const Login: Story = {
  args: { form: _placeholderForm },
  render: function LoginStory() {
    const form = useForm({ resolver: standardSchemaResolver(requireFields(['email', 'password'])) });
    return (
      <div style={{ maxWidth: 360, padding: 40 }}>
        <Form form={form} onValid={(values) => console.log('Login submitted', values)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField name="email" label="Email">
              <TextField type="email" placeholder="you@example.com" />
            </FormField>
            <FormField name="password" label="Password">
              <TextField type="password" placeholder="••••••••" />
            </FormField>
            <Button type="submit" variant="solid" tone="primary">
              Sign in
            </Button>
          </div>
        </Form>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// WithErrorSummary story
// ---------------------------------------------------------------------------

export const WithErrorSummary: Story = {
  args: { form: _placeholderForm },
  render: function WithErrorSummaryStory() {
    const form = useForm({ resolver: standardSchemaResolver(requireFields(['email', 'password'])) });
    return (
      <div style={{ maxWidth: 360, padding: 40 }}>
        <Form form={form} onValid={(values) => console.log('Submitted', values)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormErrorSummary />
            <FormField name="email" label="Email">
              <TextField type="email" placeholder="you@example.com" />
            </FormField>
            <FormField name="password" label="Password">
              <TextField type="password" placeholder="••••••••" />
            </FormField>
            <Button type="submit" variant="solid" tone="primary">
              Sign in
            </Button>
          </div>
        </Form>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// FieldArray story
// ---------------------------------------------------------------------------

function FieldArrayForm() {
  const form = useForm();
  return (
    <Form form={form} onValid={(values) => console.log('Contacts submitted', values)}>
      {/* useFieldArray must run inside <Form> — split into a child so the
          FormContext provider is mounted before the hook reads it. */}
      <Contacts />
    </Form>
  );
}

function Contacts() {
  const { fields, append, remove } = useFieldArray<{ name: string }>('contacts');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {fields.map((field, i) => (
        <div key={field.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <FormField name={`contacts.${i}.name`} label={`Contact ${i + 1}`}>
            <TextField placeholder="Full name" />
          </FormField>
          <Button type="button" variant="ghost" tone="danger" onClick={() => remove(i)}>
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        tone="primary"
        onClick={() => append({ name: '' })}
      >
        Add contact
      </Button>
      <Button type="submit" variant="solid" tone="primary">
        Save contacts
      </Button>
    </div>
  );
}

export const FieldArray: Story = {
  args: { form: _placeholderForm },
  render: function FieldArrayStory() {
    return (
      <div style={{ maxWidth: 480, padding: 40 }}>
        <FieldArrayForm />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Showcase story — representative subset for axe/visual testing
// ---------------------------------------------------------------------------

function ShowcaseLoginForm() {
  const form = useForm({ resolver: standardSchemaResolver(requireFields(['email', 'password'])) });
  return (
    <Form form={form} onValid={(values) => console.log('Showcase submitted', values)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

export const Showcase: Story = {
  args: { form: _placeholderForm },
  parameters: { layout: 'fullscreen' },
  render: function ShowcaseStory() {
    return (
      <div style={{ display: 'flex', gap: 48, padding: 40, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 320 }}>
          <ShowcaseLoginForm />
        </div>
      </div>
    );
  },
};

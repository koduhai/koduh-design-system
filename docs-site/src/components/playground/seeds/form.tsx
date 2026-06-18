import {
  TextField,
  PasswordInput,
  Textarea,
  NumberField,
  PinInput,
  Radio,
  RadioGroup,
  Select,
  Combobox,
  TagInput,
  Rating,
  FileUpload,
  ColorPicker,
  DatePicker,
  DateRangePicker,
  TimePicker,
  Calendar,
  FormField,
  Form,
  Button,
  useForm,
} from '@koduhai/design-system';
import type { Seed } from './types';

const COUNTRY_OPTIONS = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
];

// Form needs a form instance from useForm(), which is a hook. Wrap it in a tiny
// component so the playground can render a valid, self-contained form.
function FormSeed() {
  const form = useForm();
  return (
    <Form form={form} onValid={() => {}}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ku-space-4)' }}>
        <FormField name="email" label="Email" required>
          <TextField type="email" placeholder="you@example.com" />
        </FormField>
        <Button type="submit" variant="solid" tone="primary">
          Sign in
        </Button>
      </div>
    </Form>
  );
}

// Playground seeds for Form-control components. Add: Name: { Component, props?, children? }.
const seeds: Record<string, Seed> = {
  TextField: {
    Component: TextField,
    props: {
      label: 'Email',
      placeholder: 'you@example.com',
      helperText: 'We never share your email.',
    },
  },
  PasswordInput: {
    Component: PasswordInput,
    props: {
      label: 'Password',
      helperText: 'At least 8 characters.',
      defaultValue: 'hunter2',
    },
  },
  Textarea: {
    Component: Textarea,
    props: {
      label: 'Bio',
      placeholder: 'Tell us about yourself',
      helperText: 'A short description.',
    },
  },
  NumberField: {
    Component: NumberField,
    props: {
      label: 'Quantity',
      defaultValue: 1,
      min: 0,
      max: 10,
      step: 1,
    },
  },
  PinInput: {
    Component: PinInput,
    props: {
      'aria-label': 'One-time code',
      length: 6,
    },
  },
  Radio: {
    Component: RadioGroup,
    props: {
      label: 'Plan',
      value: 'pro',
      children: (
        <>
          <Radio value="free" label="Free" />
          <Radio value="pro" label="Pro" />
          <Radio value="team" label="Team" />
        </>
      ),
    },
  },
  Select: {
    Component: Select,
    props: {
      label: 'Country',
      options: COUNTRY_OPTIONS,
      placeholder: 'Choose a country',
      clearable: true,
    },
  },
  Combobox: {
    Component: Combobox,
    props: {
      label: 'Country',
      options: COUNTRY_OPTIONS,
      placeholder: 'Search a country',
      defaultValue: 'us',
      clearable: true,
    },
  },
  TagInput: {
    Component: TagInput,
    props: {
      label: 'Skills',
      defaultValue: ['react', 'typescript'],
      helperText: 'Press Enter or comma to add.',
    },
  },
  Rating: {
    Component: Rating,
    props: {
      'aria-label': 'Rate this product',
      defaultValue: 3,
    },
  },
  FileUpload: {
    Component: FileUpload,
    props: {
      onFiles: () => {},
    },
  },
  ColorPicker: {
    Component: ColorPicker,
    props: {
      label: 'Brand color',
      defaultValue: '#1B5FCC',
    },
  },
  DatePicker: {
    Component: DatePicker,
    props: {
      label: 'Event date',
      defaultValue: new Date(2026, 5, 15),
    },
  },
  DateRangePicker: {
    Component: DateRangePicker,
    props: {
      label: 'Trip dates',
      defaultValue: { start: new Date(2026, 5, 10), end: new Date(2026, 5, 16) },
    },
  },
  TimePicker: {
    Component: TimePicker,
    props: {
      label: 'Time',
      defaultValue: new Date(2024, 0, 1, 9, 30),
    },
  },
  Calendar: {
    Component: Calendar,
    props: {
      defaultValue: new Date(2026, 5, 15),
    },
  },
  FormField: {
    Component: FormField,
    props: {
      label: 'Email address',
      helperText: 'We never share it.',
      children: <TextField type="email" placeholder="you@example.com" />,
    },
  },
  Form: {
    Component: FormSeed,
  },
};

export default seeds;

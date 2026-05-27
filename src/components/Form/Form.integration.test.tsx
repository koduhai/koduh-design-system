import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from './Form';
import { useForm } from './useForm';
import type { FormApi } from './useForm';
import { useFormField } from './useFormField';
import { standardSchemaResolver } from './resolver';
import type { StandardSchemaV1 } from './resolver';
import { FormField } from '../FormField';
import { TextField } from '../TextField';
import { Checkbox } from '../Checkbox';
import { Switch } from '../Switch';
import { RadioGroup, Radio } from '../Radio';
import { Slider } from '../Slider';
import { Rating } from '../Rating';

function schema(): StandardSchemaV1 {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate(value: unknown) {
        const v = value as { name?: string; email?: string };
        const issues: { message: string; path: string[] }[] = [];
        if (!v.name) issues.push({ message: 'Name required', path: ['name'] });
        if (!v.email) issues.push({ message: 'Email required', path: ['email'] });
        return issues.length ? { issues } : { value: v };
      },
    },
  };
}

describe('Form integration', () => {
  it('submits valid values and focuses the first invalid field on failure', async () => {
    const onValid = vi.fn();
    function App() {
      const form = useForm({ resolver: standardSchemaResolver(schema()) });
      return (
        <Form form={form} onValid={onValid} aria-label="signup">
          <FormField name="name" label="Name"><TextField /></FormField>
          <FormField name="email" label="Email"><TextField /></FormField>
          <button type="submit">Submit</button>
        </Form>
      );
    }
    render(<App />);

    fireEvent.click(screen.getByText('Submit'));
    expect(await screen.findByText('Name required')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus());
    expect(onValid).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@x.com' } });
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() =>
      expect(onValid).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@x.com' }),
    );
  });
});

describe('boolean/choice inputs bound to a Form', () => {
  function bind(name: string, defaults: Record<string, unknown>, ui: React.ReactNode) {
    let api!: FormApi;
    function Probe() {
      const f = useFormField(name);
      return <span data-testid="v">{JSON.stringify(f.value ?? null)}</span>;
    }
    function Wrap() {
      api = useForm({ defaultValues: defaults });
      return (
        <Form form={api} aria-label="f">
          {ui}
          <Probe />
        </Form>
      );
    }
    render(<Wrap />);
    return () => api;
  }

  it('Checkbox: reads checked boolean from form and writes it back', async () => {
    bind('agree', { agree: false }, (
      <FormField name="agree" label="Agree"><Checkbox /></FormField>
    ));
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.checked).toBe(false);
    await userEvent.click(box);
    expect(screen.getByTestId('v')).toHaveTextContent('true');
  });

  it('Checkbox: seeds checked from a truthy form default', () => {
    bind('agree', { agree: true }, (
      <FormField name="agree" label="Agree"><Checkbox /></FormField>
    ));
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('Switch: reads checked boolean from form and writes it back', async () => {
    bind('on', { on: false }, (
      <FormField name="on" label="On"><Switch /></FormField>
    ));
    const sw = screen.getByRole('switch') as HTMLInputElement;
    expect(sw.checked).toBe(false);
    await userEvent.click(sw);
    expect(screen.getByTestId('v')).toHaveTextContent('true');
  });

  it('RadioGroup: reads the selected value from form and writes it back', async () => {
    bind('plan', { plan: 'a' }, (
      <FormField name="plan" label="Plan">
        <RadioGroup>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </FormField>
    ));
    expect((screen.getByLabelText('A') as HTMLInputElement).checked).toBe(true);
    await userEvent.click(screen.getByLabelText('B'));
    expect(screen.getByTestId('v')).toHaveTextContent('"b"');
  });

  it('Slider: reads the number from form and writes it back', async () => {
    const get = bind('vol', { vol: 20 }, (
      <FormField name="vol" label="Volume"><Slider min={0} max={100} step={10} /></FormField>
    ));
    const thumb = screen.getByRole('slider');
    expect(thumb).toHaveAttribute('aria-valuenow', '20');
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(get().getValues().vol).toBe(30);
  });

  it('Rating: reads the number from form and writes it back', async () => {
    bind('stars', { stars: 2 }, (
      <FormField name="stars" label="Stars"><Rating /></FormField>
    ));
    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(radios[3]!);
    expect(screen.getByTestId('v')).toHaveTextContent('4');
  });

  it('standalone Checkbox is unchanged (uncontrolled toggles itself)', async () => {
    render(<Checkbox label="X" />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.checked).toBe(false);
    await userEvent.click(box);
    expect(box.checked).toBe(true);
  });
});

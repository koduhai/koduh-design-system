import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup, Radio } from './';
import { FormField } from '../FormField';

function Group(props: { value?: string; defaultValue?: string; onChange?: (v: string) => void }) {
  return (
    <RadioGroup label="Plan" {...props}>
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
    </RadioGroup>
  );
}

describe('RadioGroup / Radio', () => {
  it('exposes a radiogroup with named radios', () => {
    render(<Group />);
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('works uncontrolled with defaultValue', async () => {
    render(<Group defaultValue="free" />);
    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();
  });

  it('works controlled and calls onChange with the selected value', async () => {
    const onChange = vi.fn();
    render(<Group value="free" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    expect(onChange).toHaveBeenCalledWith('pro', expect.anything());
    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked(); // controlled
  });

  it('shares a single name across radios', () => {
    render(<Group />);
    const [a, b] = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(a!.name).toBe(b!.name);
    expect(a!.name).toBeTruthy();
  });

  it('inside FormField: group wires id + aria-labelledby/describedby/invalid/required from context', () => {
    render(
      <FormField label="Plan" required error errorText="Pick one" id="plan">
        <RadioGroup>
          <Radio value="free" label="Free" />
          <Radio value="pro" label="Pro" />
        </RadioGroup>
      </FormField>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    expect(group.id).toBe('plan');
    expect(group).toHaveAttribute('aria-labelledby', 'plan-label');
    expect(group).toHaveAttribute('aria-describedby', screen.getByText('Pick one').id);
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-required', 'true');
    // The control did not render a second "Plan" label.
    expect(screen.getAllByText('Plan')).toHaveLength(1);
  });

  it('nests the input inside its label so the positioned label contains the absolute input', () => {
    render(<Group />);
    const input = screen.getByRole('radio', { name: 'Free' });
    // The input is absolutely positioned in CSS; its containing block must be the
    // label root (which now sets position: relative), so the hit area overlays the circle.
    const label = input.closest('label');
    expect(label).not.toBeNull();
    expect(label).toContainElement(input);
  });

  it('standalone: unchanged, no describedby/invalid/required when no field context', () => {
    render(<Group />);
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    expect(group).not.toHaveAttribute('aria-describedby');
    expect(group).not.toHaveAttribute('aria-invalid');
    expect(group).not.toHaveAttribute('aria-required');
  });
});

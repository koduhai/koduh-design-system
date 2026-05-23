import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup, Radio } from './';

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
});

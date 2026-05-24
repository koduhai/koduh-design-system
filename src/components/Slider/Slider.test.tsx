import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from './Slider';

describe('Slider', () => {
  it('renders a slider with aria value attributes and a visible label', () => {
    render(<Slider label="Volume" defaultValue={30} min={0} max={100} />);
    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '30');
  });

  it('arrow keys change by step and clamp', async () => {
    const onChange = vi.fn();
    render(<Slider label="V" defaultValue={0} min={0} max={5} step={1} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(1, expect.anything());
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}'); // clamps at 0
    expect(onChange).toHaveBeenLastCalledWith(0, expect.anything());
  });

  it('Home/End jump to min/max', async () => {
    const onChange = vi.fn();
    render(<Slider label="V" defaultValue={5} min={0} max={10} onChange={onChange} />);
    screen.getByRole('slider').focus();
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(10, expect.anything());
    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith(0, expect.anything());
  });

  it('uses aria-valuetext from formatValue', () => {
    render(<Slider label="V" defaultValue={50} formatValue={(v) => `${v}%`} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '50%');
  });

  it('onChange receives (value, event?) on keyboard change', async () => {
    const onChange = vi.fn();
    render(<Slider label="V" defaultValue={0} min={0} max={5} onChange={onChange} />);
    screen.getByRole('slider').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(1, expect.anything());
  });

  it('renders error + errorText below the track and marks the thumb invalid', () => {
    render(<Slider label="V" error errorText="Out of range" />);
    expect(screen.getByText('Out of range')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards onBlur to the thumb', () => {
    const onBlur = vi.fn();
    render(<Slider label="V" onBlur={onBlur} />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    thumb.blur();
    expect(onBlur).toHaveBeenCalled();
  });
});

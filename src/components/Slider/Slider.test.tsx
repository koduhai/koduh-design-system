import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from './Slider';

// jsdom reports zero-size rects; give the track a deterministic 100px geometry
// so clientX maps cleanly to a value (x=0 → min, x=100 → max for a 0–100 range).
function mockTrackRect(track: HTMLElement) {
  vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    right: 100,
    width: 100,
    top: 0,
    bottom: 6,
    height: 6,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
}

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

  it('swaps horizontal arrow direction under RTL', async () => {
    const realGCS = window.getComputedStyle.bind(window);
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(
        (el: Element) => ({ ...realGCS(el), direction: 'rtl' }) as CSSStyleDeclaration,
      );
    const onChange = vi.fn();
    render(<Slider label="V" defaultValue={3} min={0} max={5} step={1} onChange={onChange} />);
    screen.getByRole('slider').focus();
    await userEvent.keyboard('{ArrowRight}'); // RTL: right decreases
    expect(onChange).toHaveBeenLastCalledWith(2, expect.anything());
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}'); // RTL: left increases
    expect(onChange).toHaveBeenLastCalledWith(4, expect.anything());
    spy.mockRestore();
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

  it('click-to-set jumps to the pointer position', () => {
    const onChange = vi.fn();
    render(<Slider label="V" defaultValue={0} min={0} max={100} step={1} onChange={onChange} />);
    const track = screen.getByRole('slider').parentElement as HTMLElement;
    mockTrackRect(track);
    fireEvent.pointerDown(track, { clientX: 25, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(25, expect.anything());
  });

  it('drags the thumb, tracking pointer moves until release', () => {
    const onChange = vi.fn();
    render(<Slider label="V" defaultValue={0} min={0} max={100} step={1} onChange={onChange} />);
    const thumb = screen.getByRole('slider');
    const track = thumb.parentElement as HTMLElement;
    mockTrackRect(track);

    fireEvent.pointerDown(track, { clientX: 20, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(20, expect.anything());
    // Pointer-down focuses the thumb so keyboard control follows the grab.
    expect(thumb).toHaveFocus();

    fireEvent.pointerMove(track, { clientX: 50, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(50, expect.anything());
    fireEvent.pointerMove(track, { clientX: 80, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(80, expect.anything());

    fireEvent.pointerUp(track, { clientX: 80, pointerId: 1 });
    // After release, further moves no longer update the value.
    fireEvent.pointerMove(track, { clientX: 10, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(80, expect.anything());
  });

  it('does not drag when disabled', () => {
    const onChange = vi.fn();
    render(<Slider label="V" defaultValue={40} min={0} max={100} disabled onChange={onChange} />);
    const track = screen.getByRole('slider').parentElement as HTMLElement;
    mockTrackRect(track);
    fireEvent.pointerDown(track, { clientX: 20, pointerId: 1 });
    fireEvent.pointerMove(track, { clientX: 80, pointerId: 1 });
    expect(onChange).not.toHaveBeenCalled();
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Tooltip', () => {
  it('links the trigger to the tooltip via aria-describedby on open', () => {
    render(
      <Tooltip content="More info" delay={0}>
        <button type="button">Help</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Help' });
    act(() => {
      fireEvent.focus(trigger);
      vi.runAllTimers();
    });
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('More info');
    expect(trigger).toHaveAttribute('aria-describedby', tip.id);
  });

  it('opens on hover after the delay', () => {
    render(
      <Tooltip content="Hi" delay={200}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'false');
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
  });

  it('closes on blur', () => {
    render(
      <Tooltip content="Hi" delay={0}>
        <button type="button">Help</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    act(() => {
      fireEvent.focus(trigger);
      vi.runAllTimers();
    });
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
    act(() => fireEvent.blur(trigger));
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'false');
  });
});

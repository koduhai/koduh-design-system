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

  it('merges its tooltip id with a consumer-provided aria-describedby on the trigger', () => {
    render(
      <>
        <span id="helper-text">Extra help</span>
        <Tooltip content="More info" delay={0}>
          <button type="button" aria-describedby="helper-text">
            Help
          </button>
        </Tooltip>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Help' });
    // Closed: only the consumer's own id is present.
    expect(trigger).toHaveAttribute('aria-describedby', 'helper-text');
    act(() => {
      fireEvent.focus(trigger);
      vi.runAllTimers();
    });
    const tip = screen.getByRole('tooltip');
    // Open: the consumer's id is preserved and the tooltip id is appended.
    expect(trigger).toHaveAttribute('aria-describedby', `helper-text ${tip.id}`);
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

  it('closes on Escape key', () => {
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
    act(() => fireEvent.keyDown(trigger, { key: 'Escape' }));
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'false');
  });

  it('dismisses a hover-opened tooltip with Escape even when the trigger is not focused (WCAG 1.4.13)', () => {
    render(
      <Tooltip content="Hi" delay={0}>
        <button type="button">Help</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    // Hover-open: the trigger never receives focus, so a trigger-scoped keydown
    // would not fire. Esc must still dismiss via the document-level handler.
    act(() => {
      fireEvent.mouseEnter(trigger);
      vi.runAllTimers();
    });
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
    act(() => fireEvent.keyDown(document, { key: 'Escape' }));
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'false');
  });

  it('re-opens after an Escape dismissal (no permanent suppression)', () => {
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
    act(() => fireEvent.keyDown(document, { key: 'Escape' }));
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'false');
    // Hovering again re-opens it.
    act(() => {
      fireEvent.mouseEnter(trigger);
      vi.runAllTimers();
    });
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
  });

  it('stays open when the pointer moves from the trigger onto the panel (WCAG 1.4.13)', () => {
    render(
      <Tooltip content="Hoverable" delay={100}>
        <button type="button">Help</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    act(() => {
      fireEvent.mouseEnter(trigger);
      vi.advanceTimersByTime(100);
    });
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveAttribute('data-open', 'true');

    // Pointer leaves the trigger (schedules a deferred close) then lands on the
    // panel before the delay elapses → the close is cancelled, stays open.
    act(() => {
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(tip);
      vi.advanceTimersByTime(100);
    });
    expect(tip).toHaveAttribute('data-open', 'true');
  });

  it('closes after leaving the panel without re-entering', () => {
    render(
      <Tooltip content="Hoverable" delay={100}>
        <button type="button">Help</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    act(() => {
      fireEvent.mouseEnter(trigger);
      vi.advanceTimersByTime(100);
    });
    const tip = screen.getByRole('tooltip');
    act(() => {
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(tip);
      vi.advanceTimersByTime(100);
    });
    expect(tip).toHaveAttribute('data-open', 'true');
    // Now leave the panel and let the deferred close fire.
    act(() => {
      fireEvent.mouseLeave(tip);
      vi.advanceTimersByTime(100);
    });
    expect(tip).toHaveAttribute('data-open', 'false');
  });

  it('forwards arbitrary DOM props (data-*) to the tooltip panel', () => {
    render(
      <Tooltip content="Hi" delay={0} data-testid="tip-panel">
        <button type="button">Help</button>
      </Tooltip>,
    );
    expect(screen.getByTestId('tip-panel')).toBeInTheDocument();
  });
});

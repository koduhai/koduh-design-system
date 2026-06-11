import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HoverCard } from './HoverCard';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(props?: Partial<React.ComponentProps<typeof HoverCard>>) {
  render(
    <HoverCard
      trigger={<button type="button">@koduhai</button>}
      openDelay={300}
      closeDelay={150}
      {...props}
    >
      <div>
        <strong>Koduhai</strong>
        <p>Design system maintainer</p>
      </div>
    </HoverCard>,
  );
  return screen.getByRole('button', { name: '@koduhai' });
}

describe('HoverCard', () => {
  it('opens on pointer-enter after the open delay', () => {
    const trigger = setup();
    fireEvent.mouseEnter(trigger);
    // Card present but not yet open before delay elapses.
    expect(screen.getByText('Koduhai').closest('[data-open]')).toHaveAttribute(
      'data-open',
      'false',
    );
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByText('Koduhai').closest('[data-open]')).toHaveAttribute('data-open', 'true');
  });

  it('opens on keyboard focus of the trigger', () => {
    const trigger = setup({ openDelay: 0 });
    act(() => {
      fireEvent.focus(trigger);
      vi.runAllTimers();
    });
    expect(screen.getByText('Koduhai').closest('[data-open]')).toHaveAttribute('data-open', 'true');
  });

  it('links the trigger to the card via aria-describedby and aria-details when open', () => {
    const trigger = setup({ openDelay: 0 });
    act(() => {
      fireEvent.focus(trigger);
      vi.runAllTimers();
    });
    const card = screen.getByText('Koduhai').closest('[data-open]') as HTMLElement;
    expect(trigger).toHaveAttribute('aria-describedby', card.id);
    expect(trigger).toHaveAttribute('aria-details', card.id);
  });

  it('closes on blur immediately', () => {
    const trigger = setup({ openDelay: 0 });
    act(() => {
      fireEvent.focus(trigger);
      vi.runAllTimers();
    });
    const card = screen.getByText('Koduhai').closest('[data-open]') as HTMLElement;
    expect(card).toHaveAttribute('data-open', 'true');
    act(() => fireEvent.blur(trigger));
    expect(card).toHaveAttribute('data-open', 'false');
  });

  it('closes on Escape', () => {
    const trigger = setup({ openDelay: 0 });
    act(() => {
      fireEvent.focus(trigger);
      vi.runAllTimers();
    });
    const card = screen.getByText('Koduhai').closest('[data-open]') as HTMLElement;
    act(() => fireEvent.keyDown(trigger, { key: 'Escape' }));
    expect(card).toHaveAttribute('data-open', 'false');
  });

  it('stays open when the pointer moves from the trigger onto the card', () => {
    const trigger = setup({ openDelay: 100, closeDelay: 100 });
    act(() => {
      fireEvent.mouseEnter(trigger);
      vi.advanceTimersByTime(100);
    });
    const card = screen.getByText('Koduhai').closest('[data-open]') as HTMLElement;
    expect(card).toHaveAttribute('data-open', 'true');
    act(() => {
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(card);
      vi.advanceTimersByTime(100);
    });
    expect(card).toHaveAttribute('data-open', 'true');
  });

  it('closes after leaving the card without re-entering', () => {
    const trigger = setup({ openDelay: 100, closeDelay: 100 });
    act(() => {
      fireEvent.mouseEnter(trigger);
      vi.advanceTimersByTime(100);
    });
    const card = screen.getByText('Koduhai').closest('[data-open]') as HTMLElement;
    act(() => {
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(card);
      vi.advanceTimersByTime(100);
    });
    expect(card).toHaveAttribute('data-open', 'true');
    act(() => {
      fireEvent.mouseLeave(card);
      vi.advanceTimersByTime(100);
    });
    expect(card).toHaveAttribute('data-open', 'false');
  });

  it("preserves the trigger's own handlers", () => {
    const onMouseEnter = vi.fn();
    render(
      <HoverCard
        trigger={
          <button type="button" onMouseEnter={onMouseEnter}>
            Hover
          </button>
        }
        openDelay={0}
      >
        <span>Card</span>
      </HoverCard>,
    );
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(onMouseEnter).toHaveBeenCalled();
  });

  it('forwards arbitrary DOM props to the card panel', () => {
    setup({ 'data-testid': 'hc-panel' } as never);
    expect(screen.getByTestId('hc-panel')).toBeInTheDocument();
  });

  it('keeps the aria linkage intact when a consumer passes an id', () => {
    const trigger = setup({ id: 'consumer-id', openDelay: 0 });
    act(() => {
      fireEvent.focus(trigger);
      vi.runAllTimers();
    });
    const card = screen.getByText('Koduhai').closest('[data-open]') as HTMLElement;
    // The consumer id lands on the trigger, not on the card.
    expect(trigger).toHaveAttribute('id', 'consumer-id');
    expect(card.id).not.toBe('consumer-id');
    // The internal card id still wires aria-describedby/aria-details.
    expect(trigger).toHaveAttribute('aria-describedby', card.id);
    expect(trigger).toHaveAttribute('aria-details', card.id);
  });
});

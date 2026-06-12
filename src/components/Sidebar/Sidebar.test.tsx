import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import type { SidebarItem } from './Sidebar';

const ITEMS: SidebarItem[] = [
  { id: 'home', label: 'Home', href: '/', active: true },
  { id: 'projects', label: 'Projects', href: '/projects' },
  { id: 'settings', label: 'Settings', onClick: () => {} },
];

describe('Sidebar', () => {
  it('renders a nav landmark with a default accessible name', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByRole('navigation', { name: 'Sidebar' })).toBeInTheDocument();
  });

  it('honors a custom aria-label', () => {
    render(<Sidebar items={ITEMS} aria-label="Main navigation" />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('renders href items as links and onClick-only items as buttons', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('marks the active item with aria-current="page"', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Projects' })).not.toHaveAttribute('aria-current');
  });

  it('fires an item onClick', async () => {
    const onClick = vi.fn();
    render(<Sidebar items={[{ id: 'a', label: 'Action', onClick }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Action' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables a disabled item (rendered as a disabled button)', () => {
    render(<Sidebar items={[{ id: 'x', label: 'Off', href: '/x', disabled: true }]} />);
    const btn = screen.getByRole('button', { name: 'Off' });
    expect(btn).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Off' })).toBeNull();
  });

  it('toggles collapsed state (uncontrolled) and updates the toggle label + aria-pressed', async () => {
    render(<Sidebar items={ITEMS} />);
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    // The toggle is a toggle button (aria-pressed), not a disclosure: the list
    // is always present so aria-expanded/aria-controls would be misleading.
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).not.toHaveAttribute('aria-expanded');
    expect(toggle).not.toHaveAttribute('aria-controls');
    await userEvent.click(toggle);
    const expandToggle = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(expandToggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('respects controlled collapsed and calls onCollapsedChange without changing state itself', async () => {
    const onCollapsedChange = vi.fn();
    const { container } = render(
      <Sidebar items={ITEMS} collapsed onCollapsedChange={onCollapsedChange} />,
    );
    const nav = container.querySelector('nav')!;
    expect(nav).toHaveAttribute('data-collapsed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(nav).toHaveAttribute('data-collapsed', 'true'); // controlled — unchanged
  });

  it('renders header and footer slots', () => {
    render(
      <Sidebar
        items={ITEMS}
        header={<span data-testid="head" />}
        footer={<span data-testid="foot" />}
      />,
    );
    expect(screen.getByTestId('head')).toBeInTheDocument();
    expect(screen.getByTestId('foot')).toBeInTheDocument();
  });

  it('keeps item labels accessible even when collapsed', () => {
    render(<Sidebar items={ITEMS} defaultCollapsed />);
    // Labels are visually hidden (not display:none), so the accessible name persists.
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });

  it('adds a native title to items only when collapsed (hover discoverability)', () => {
    const { rerender } = render(<Sidebar items={ITEMS} />);
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('title');
    rerender(<Sidebar items={ITEMS} collapsed />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('title', 'Home');
  });

  it('auto-collapses below the collapseBelow breakpoint via matchMedia', () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    const mql = {
      matches: true, // viewport is below the breakpoint
      media: '',
      onchange: null,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    const spy = vi.spyOn(window, 'matchMedia').mockReturnValue(mql as unknown as MediaQueryList);
    const { container } = render(<Sidebar items={ITEMS} collapseBelow={768} />);
    expect(spy).toHaveBeenCalledWith('(max-width: 768px)');
    expect(container.querySelector('nav')).toHaveAttribute('data-collapsed', 'true');
    spy.mockRestore();
  });

  it('does not re-subscribe or re-fire onCollapsedChange on re-render with an unstable handler', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const mql = {
      matches: true,
      media: '',
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    const spy = vi.spyOn(window, 'matchMedia').mockReturnValue(mql as unknown as MediaQueryList);
    // Controlled + a fresh inline handler identity on every render. The media
    // effect must subscribe once and fire onCollapsedChange once (for the
    // initial match), not on each subsequent re-render.
    const onCollapsedChange = vi.fn();
    const { rerender } = render(
      <Sidebar
        items={ITEMS}
        collapsed
        collapseBelow={768}
        onCollapsedChange={() => onCollapsedChange()}
      />,
    );
    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);

    rerender(
      <Sidebar
        items={ITEMS}
        collapsed
        collapseBelow={768}
        onCollapsedChange={() => onCollapsedChange()}
      />,
    );
    rerender(
      <Sidebar
        items={ITEMS}
        collapsed
        collapseBelow={768}
        onCollapsedChange={() => onCollapsedChange()}
      />,
    );
    // Still subscribed exactly once, never torn down, and not re-fired.
    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(removeEventListener).not.toHaveBeenCalled();
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('forwards a ref to the nav element', () => {
    const ref = { current: null as HTMLElement | null };
    render(<Sidebar items={ITEMS} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('NAV');
  });
});

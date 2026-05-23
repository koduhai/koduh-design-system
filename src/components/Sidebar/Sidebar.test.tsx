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

  it('toggles collapsed state (uncontrolled) and updates the toggle label + aria-expanded', async () => {
    render(<Sidebar items={ITEMS} />);
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    const expandToggle = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(expandToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('respects controlled collapsed and calls onToggle without changing state itself', async () => {
    const onToggle = vi.fn();
    const { container } = render(<Sidebar items={ITEMS} collapsed onToggle={onToggle} />);
    const nav = container.querySelector('nav')!;
    expect(nav).toHaveAttribute('data-collapsed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(onToggle).toHaveBeenCalledWith(false);
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

  it('forwards a ref to the nav element', () => {
    const ref = { current: null as HTMLElement | null };
    render(<Sidebar items={ITEMS} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('NAV');
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotificationBadge } from './NotificationBadge';

describe('NotificationBadge', () => {
  it('renders the count over its child', () => {
    render(
      <NotificationBadge count={3}>
        <button>Inbox</button>
      </NotificationBadge>,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inbox' })).toBeInTheDocument();
  });
  it('clamps to max with a plus suffix', () => {
    render(
      <NotificationBadge count={150} max={99}>
        <span>x</span>
      </NotificationBadge>,
    );
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
  it('hides when count is 0 unless showZero', () => {
    const { rerender, container } = render(
      <NotificationBadge count={0}>
        <span>x</span>
      </NotificationBadge>,
    );
    expect(container.querySelector('[data-badge]')).toBeNull();
    rerender(
      <NotificationBadge count={0} showZero>
        <span>x</span>
      </NotificationBadge>,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });
  it('renders a dot with no number when dot is set', () => {
    const { container } = render(
      <NotificationBadge dot label="New">
        <span>x</span>
      </NotificationBadge>,
    );
    const badge = container.querySelector('[data-badge]')!;
    expect(badge).toHaveAttribute('data-dot', 'true');
    expect(badge).not.toHaveAttribute('aria-hidden');
    expect(screen.getByText('New')).toBeInTheDocument(); // visually-hidden label
  });
  it('hides a label-less dot from AT (shape/color is not a sufficient signal)', () => {
    const { container } = render(
      <NotificationBadge dot>
        <span>x</span>
      </NotificationBadge>,
    );
    const badge = container.querySelector('[data-badge]')!;
    expect(badge).toHaveAttribute('data-dot', 'true');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
  });
  it('reflects tone and placement', () => {
    const { container } = render(
      <NotificationBadge count={1} tone="primary" placement="bottom-start">
        <span>x</span>
      </NotificationBadge>,
    );
    const badge = container.querySelector('[data-badge]')!;
    expect(badge).toHaveAttribute('data-tone', 'primary');
    expect(badge).toHaveAttribute('data-placement', 'bottom-start');
  });
});

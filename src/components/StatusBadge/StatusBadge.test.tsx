import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import type { StatusBadgeStatus } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders the text label so color is never the only signal', () => {
    render(<StatusBadge status="active" label="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('always renders the label for every status', () => {
    const statuses: StatusBadgeStatus[] = ['active', 'inactive', 'pending', 'error'];
    for (const status of statuses) {
      const { unmount } = render(<StatusBadge status={status} label={`label-${status}`} />);
      expect(screen.getByText(`label-${status}`)).toBeInTheDocument();
      unmount();
    }
  });

  it('defaults to the subtle variant and reflects status/variant as data attributes', () => {
    const { rerender } = render(<StatusBadge status="active" label="A" />);
    let el = screen.getByText('A').closest('[data-status]')!;
    expect(el).toHaveAttribute('data-status', 'active');
    expect(el).toHaveAttribute('data-variant', 'subtle');

    rerender(<StatusBadge status="error" label="A" variant="solid" />);
    el = screen.getByText('A').closest('[data-status]')!;
    expect(el).toHaveAttribute('data-status', 'error');
    expect(el).toHaveAttribute('data-variant', 'solid');
  });

  it('forwards a ref to the span element', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<StatusBadge ref={ref} status="pending" label="Pending" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('passes through className and standard span attributes', () => {
    render(<StatusBadge status="inactive" label="Off" className="custom" id="badge-1" />);
    const el = screen.getByText('Off').closest('[data-status]')!;
    expect(el).toHaveClass('custom');
    expect(el).toHaveAttribute('id', 'badge-1');
  });
});

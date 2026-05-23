import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title as a level-2 heading by default', () => {
    render(<EmptyState title="No results" />);
    const heading = screen.getByRole('heading', { name: 'No results' });
    expect(heading.tagName).toBe('H2');
  });

  it('honors a custom headingLevel', () => {
    render(<EmptyState title="Empty" headingLevel={3} />);
    expect(screen.getByRole('heading', { name: 'Empty', level: 3 })).toBeInTheDocument();
  });

  it('renders an optional description', () => {
    render(<EmptyState title="No results" description="Try a different filter." />);
    expect(screen.getByText('Try a different filter.')).toBeInTheDocument();
  });

  it('renders the action node', () => {
    render(<EmptyState title="No results" action={<button>Reset</button>} />);
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('renders a decorative icon hidden from assistive tech', () => {
    const { container } = render(<EmptyState title="Empty" icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toContainElement(
      screen.getByTestId('icon'),
    );
  });

  it('forwards a ref and arbitrary props to the root', () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(<EmptyState ref={ref} title="X" data-testid="empty" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(container.firstElementChild).toHaveAttribute('data-testid', 'empty');
  });
});

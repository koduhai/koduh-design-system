import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './Breadcrumbs';

const items = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Data', href: '/library/data' },
  { label: 'Current' },
];

describe('Breadcrumbs', () => {
  it('renders a labeled nav landmark', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('renders links for items with href and marks the last as current', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    const current = screen.getByText('Current');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('collapses middle items when over maxItems', () => {
    render(<Breadcrumbs items={items} maxItems={3} />);
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Library' })).toBeNull();
    // First and last (current) items survive the collapse.
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    const current = screen.getByText('Current');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('keeps the first and current items with a tiny maxItems', () => {
    render(<Breadcrumbs items={items} maxItems={2} />);
    // Trail stays coherent: first, ellipsis, last.
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('…')).toBeInTheDocument();
    const current = screen.getByText('Current');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Library' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Data' })).toBeNull();
  });

  it('preserves the current page even when maxItems is 1', () => {
    render(<Breadcrumbs items={items} maxItems={1} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('…')).toBeInTheDocument();
    const current = screen.getByText('Current');
    expect(current).toHaveAttribute('aria-current', 'page');
  });
});

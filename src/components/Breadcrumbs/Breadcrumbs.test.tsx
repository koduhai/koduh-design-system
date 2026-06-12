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

  it('marks only the last crumb as current even when a middle item lacks an href', () => {
    const withGap = [
      { label: 'Home', href: '/' },
      { label: 'Library' }, // middle item without an href
      { label: 'Current' },
    ];
    render(<Breadcrumbs items={withGap} />);
    const currents = screen
      .getAllByText(/Home|Library|Current/)
      .filter((el) => el.getAttribute('aria-current') === 'page');
    expect(currents).toHaveLength(1);
    expect(currents[0]).toHaveTextContent('Current');
    // The href-less middle item is a plain span, not aria-current.
    expect(screen.getByText('Library')).not.toHaveAttribute('aria-current');
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

  it('announces how many breadcrumbs are collapsed and hides the glyph from AT', () => {
    render(<Breadcrumbs items={items} maxItems={3} />);
    // 4 items, maxItems 3 -> first, ellipsis, one trailing, last => 1 hidden.
    expect(screen.getByText('1 more breadcrumb')).toBeInTheDocument();
    // The bare ellipsis glyph is not exposed to assistive tech.
    expect(screen.getByText('…')).toHaveAttribute('aria-hidden', 'true');
  });

  it('pluralizes the collapsed-count announcement', () => {
    render(<Breadcrumbs items={items} maxItems={2} />);
    // 4 items, maxItems 2 -> first, ellipsis, last => 2 hidden.
    expect(screen.getByText('2 more breadcrumbs')).toBeInTheDocument();
  });
});

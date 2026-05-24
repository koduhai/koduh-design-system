import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title as an h1 by default inside a header landmark', () => {
    render(<PageHeader title="Dashboard" />);
    const heading = screen.getByRole('heading', { name: 'Dashboard', level: 1 });
    expect(heading).toBeInTheDocument();
    expect(screen.getByRole('banner')).toContainElement(heading); // <header> => banner role
  });

  it('honors a custom headingLevel', () => {
    render(<PageHeader title="Section" headingLevel={2} />);
    expect(screen.getByRole('heading', { name: 'Section', level: 2 })).toBeInTheDocument();
  });

  it('renders an optional subtitle', () => {
    render(<PageHeader title="Dashboard" subtitle="Welcome back" />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('renders a single Breadcrumb nav when given an items array', () => {
    render(
      <PageHeader
        title="Agent"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Agents', href: '/agents' },
          { label: 'Agent' },
        ]}
      />,
    );
    const navs = screen.getAllByRole('navigation', { name: 'Breadcrumb' });
    expect(navs).toHaveLength(1);
    expect(screen.getByText('Agents')).toBeInTheDocument();
  });

  it('does NOT wrap a ReactNode breadcrumbs slot in its own nav (no nesting)', () => {
    render(
      <PageHeader
        title="Agent"
        breadcrumbs={
          <nav aria-label="Breadcrumb">
            <a href="/">Home</a>
          </nav>
        }
      />,
    );
    // Only the passed nav exists — PageHeader added no second Breadcrumb landmark.
    expect(screen.getAllByRole('navigation', { name: 'Breadcrumb' })).toHaveLength(1);
  });

  it('renders actions', () => {
    render(<PageHeader title="Dashboard" actions={<button>New</button>} />);
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
  });

  it('forwards a ref and arbitrary props to the header root', () => {
    const ref = { current: null as HTMLElement | null };
    const { container } = render(<PageHeader ref={ref} title="X" data-testid="ph" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(container.firstElementChild).toHaveAttribute('data-testid', 'ph');
  });
});

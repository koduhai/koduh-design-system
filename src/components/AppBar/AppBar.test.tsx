import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppBar } from './AppBar';

describe('AppBar', () => {
  it('renders a header (banner) landmark', () => {
    render(<AppBar title="Koduh" />);
    const banner = screen.getByRole('banner');
    expect(banner.tagName).toBe('HEADER');
    expect(banner).toHaveTextContent('Koduh');
  });

  it('renders logo, title, and actions', () => {
    render(
      <AppBar
        logo={<span data-testid="logo" />}
        title="Dashboard"
        actions={<button>Profile</button>}
      />,
    );
    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
  });

  it('defaults to static position with elevation, reflected as data attributes', () => {
    render(<AppBar title="X" />);
    const banner = screen.getByRole('banner');
    expect(banner).toHaveAttribute('data-position', 'static');
    expect(banner).toHaveAttribute('data-elevation', 'true');
  });

  it('reflects position and elevation overrides', () => {
    render(<AppBar title="X" position="sticky" elevation={false} />);
    const banner = screen.getByRole('banner');
    expect(banner).toHaveAttribute('data-position', 'sticky');
    expect(banner).not.toHaveAttribute('data-elevation');
  });

  it('forwards a ref and arbitrary props to the header root', () => {
    const ref = { current: null as HTMLElement | null };
    render(<AppBar ref={ref} title="X" data-testid="bar" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(screen.getByTestId('bar')).toBe(ref.current);
  });
});

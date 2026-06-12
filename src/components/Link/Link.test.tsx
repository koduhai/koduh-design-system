import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Link } from './Link';

describe('Link', () => {
  it('renders an anchor with href and default tone/underline', () => {
    render(<Link href="/x">go</Link>);
    const el = screen.getByRole('link', { name: 'go' });
    expect(el).toHaveAttribute('href', '/x');
    expect(el).toHaveAttribute('data-tone', 'primary');
    expect(el).toHaveAttribute('data-underline', 'always');
  });
  it('honors tone + underline', () => {
    render(
      <Link href="/x" tone="neutral" underline="hover">
        go
      </Link>,
    );
    const el = screen.getByRole('link');
    expect(el).toHaveAttribute('data-tone', 'neutral');
    expect(el).toHaveAttribute('data-underline', 'hover');
  });
  it('renders the consumer element with asChild (router Link)', () => {
    render(
      <Link asChild>
        <a data-testid="l" href="/r">
          r
        </a>
      </Link>,
    );
    expect(screen.getByTestId('l').tagName).toBe('A');
    expect(screen.getByTestId('l')).toHaveAttribute('data-tone', 'primary');
  });
});

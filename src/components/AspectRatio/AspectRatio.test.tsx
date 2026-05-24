import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AspectRatio } from './AspectRatio';

describe('AspectRatio', () => {
  it('renders its children', () => {
    render(
      <AspectRatio>
        <img src="/x.png" alt="x" />
      </AspectRatio>,
    );
    expect(screen.getByRole('img', { name: 'x' })).toBeInTheDocument();
  });

  it('defaults the --ar custom property to 16 / 9', () => {
    render(<AspectRatio data-testid="ar" />);
    const el = screen.getByTestId('ar');
    expect(el.style.getPropertyValue('--ar')).toBe(String(16 / 9));
  });

  it('applies a custom ratio to the --ar custom property', () => {
    render(<AspectRatio ratio={4 / 3} data-testid="ar" />);
    const el = screen.getByTestId('ar');
    expect(el.style.getPropertyValue('--ar')).toBe(String(4 / 3));
  });

  it('merges a consumer-provided style without dropping --ar', () => {
    render(<AspectRatio ratio={1} style={{ maxWidth: 200 }} data-testid="ar" />);
    const el = screen.getByTestId('ar');
    expect(el.style.getPropertyValue('--ar')).toBe('1');
    expect(el.style.maxWidth).toBe('200px');
  });

  it('forwards className and a ref to the root', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<AspectRatio className="extra" ref={ref} data-testid="ar" />);
    const el = screen.getByTestId('ar');
    expect(el).toHaveClass('extra');
    expect(ref.current).toBe(el);
  });
});

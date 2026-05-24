import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('renders a <kbd> element with its children', () => {
    render(<Kbd>Esc</Kbd>);
    const el = screen.getByText('Esc');
    expect(el.tagName).toBe('KBD');
  });

  it('defaults to size md and reflects size as a data attribute', () => {
    render(<Kbd>A</Kbd>);
    expect(screen.getByText('A')).toHaveAttribute('data-size', 'md');
  });

  it('reflects the sm size override', () => {
    render(<Kbd size="sm">A</Kbd>);
    expect(screen.getByText('A')).toHaveAttribute('data-size', 'sm');
  });

  it('forwards className and DOM props to the root', () => {
    render(
      <Kbd className="extra" data-testid="kbd" aria-label="Escape key">
        Esc
      </Kbd>,
    );
    const el = screen.getByTestId('kbd');
    expect(el).toHaveClass('extra');
    expect(el).toHaveAttribute('aria-label', 'Escape key');
  });

  it('forwards a ref to the underlying <kbd>', () => {
    const ref = { current: null as HTMLElement | null };
    render(<Kbd ref={ref}>X</Kbd>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current!.tagName).toBe('KBD');
  });
});

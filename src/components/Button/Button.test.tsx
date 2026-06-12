import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders a native button with type="button" by default', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('defaults to solid/primary/md and reflects overrides as data attributes', () => {
    const { rerender } = render(<Button>X</Button>);
    let btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-variant', 'solid');
    expect(btn).toHaveAttribute('data-tone', 'primary');
    expect(btn).toHaveAttribute('data-size', 'md');

    rerender(
      <Button variant="outline" tone="danger" size="lg">
        X
      </Button>,
    );
    btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-variant', 'outline');
    expect(btn).toHaveAttribute('data-tone', 'danger');
    expect(btn).toHaveAttribute('data-size', 'lg');
  });

  it.each(['success', 'warning'] as const)('supports the %s tone', (tone) => {
    render(<Button tone={tone}>X</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-tone', tone);
  });

  it('fires onClick, but not when disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders start and end icons', () => {
    render(
      <Button startIcon={<span data-testid="start" />} endIcon={<span data-testid="end" />}>
        Go
      </Button>,
    );
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.getByTestId('end')).toBeInTheDocument();
  });

  it('renders as the child element when asChild is set, merging props', () => {
    render(
      <Button asChild tone="danger">
        <a href="/contact">Contact</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Contact' });
    expect(link).toHaveAttribute('href', '/contact');
    expect(link).toHaveAttribute('data-tone', 'danger');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('forwards a ref to the button element', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is decorative (aria-hidden) without a label', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes role=status and an accessible label when label is given', () => {
    render(<Spinner label="Loading" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading');
  });

  it('reflects size and tone as data attributes', () => {
    const { container } = render(<Spinner size="lg" tone="neutral" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('data-size', 'lg');
    expect(el).toHaveAttribute('data-tone', 'neutral');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Divider } from './Divider';

describe('Divider', () => {
  it('is a separator with orientation by default', () => {
    render(<Divider orientation="vertical" />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('renders a label and becomes presentational', () => {
    const { container } = render(<Divider>OR</Divider>);
    expect(screen.getByText('OR')).toBeInTheDocument();
    expect(container.querySelector('[role="separator"]')).toBeNull();
  });
});

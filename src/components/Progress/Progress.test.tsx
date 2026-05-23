import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './Progress';

describe('Progress', () => {
  it('exposes determinate value via aria attributes', () => {
    render(<Progress value={40} label="Uploading" />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('respects a custom max', () => {
    render(<Progress value={3} max={5} label="Steps" />);
    expect(screen.getByRole('progressbar', { name: 'Steps' })).toHaveAttribute(
      'aria-valuemax',
      '5',
    );
  });

  it('omits aria-valuenow when indeterminate', () => {
    render(<Progress label="Loading" />);
    const bar = screen.getByRole('progressbar', { name: 'Loading' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('data-indeterminate', 'true');
  });

  it('clamps the value to the 0..max range', () => {
    render(<Progress value={150} label="Over" />);
    expect(screen.getByRole('progressbar', { name: 'Over' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });

  it('renders a visible label and percentage when showValue', () => {
    render(<Progress value={25} label="Sync" showValue />);
    expect(screen.getByText('Sync')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('reflects tone and size as data attributes', () => {
    render(<Progress value={50} label="X" tone="danger" size="lg" />);
    const bar = screen.getByRole('progressbar', { name: 'X' });
    expect(bar).toHaveAttribute('data-tone', 'danger');
    expect(bar.closest('[data-size]')).toHaveAttribute('data-size', 'lg');
  });
});

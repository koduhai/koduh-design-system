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

  it('does not produce a negative aria-valuenow when max is non-positive', () => {
    render(<Progress value={50} max={0} label="Edge" />);
    expect(screen.getByRole('progressbar', { name: 'Edge' })).toHaveAttribute('aria-valuenow', '0');
  });

  it('reports aria-valuenow equal to max at completion', () => {
    render(<Progress value={5} max={5} label="Done" />);
    expect(screen.getByRole('progressbar', { name: 'Done' })).toHaveAttribute('aria-valuenow', '5');
  });

  it('omits the visible value row when showValue is set without a label', () => {
    render(<Progress value={30} showValue />);
    expect(screen.queryByText('30%')).toBeNull();
  });

  it('exposes aria-valuetext as a percentage for a custom max', () => {
    render(<Progress value={3} max={5} label="Steps" />);
    expect(screen.getByRole('progressbar', { name: 'Steps' })).toHaveAttribute(
      'aria-valuetext',
      '60%',
    );
  });

  it('omits aria-valuetext when indeterminate', () => {
    render(<Progress label="Loading" />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).not.toHaveAttribute(
      'aria-valuetext',
    );
  });

  it('treats a non-finite value as indeterminate (no NaN attributes)', () => {
    render(<Progress value={NaN} label="Broken" />);
    const bar = screen.getByRole('progressbar', { name: 'Broken' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).not.toHaveAttribute('aria-valuetext');
    expect(bar).toHaveAttribute('data-indeterminate', 'true');
  });
});

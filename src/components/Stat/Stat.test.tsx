import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stat } from './Stat';

describe('Stat', () => {
  it('renders the label and value', () => {
    render(<Stat label="MRR" value="$48.2k" />);
    expect(screen.getByText('MRR')).toBeInTheDocument();
    expect(screen.getByText('$48.2k')).toBeInTheDocument();
  });

  it('reflects the trend as a data attribute', () => {
    const { container } = render(<Stat label="Users" value="1,204" delta="12%" trend="up" />);
    const root = container.querySelector('[data-trend]')!;
    expect(root).toHaveAttribute('data-trend', 'up');
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('exposes the trend direction as accessible text (not colour-only)', () => {
    render(<Stat label="Churn" value="2.1%" delta="0.4%" trend="down" />);
    // The visually-hidden trend word makes the change direction available to AT.
    expect(screen.getByText(/Decreased/)).toBeInTheDocument();
  });

  it('renders helpText when provided', () => {
    render(<Stat label="MRR" value="$48.2k" helpText="vs. last month" />);
    expect(screen.getByText('vs. last month')).toBeInTheDocument();
  });
});

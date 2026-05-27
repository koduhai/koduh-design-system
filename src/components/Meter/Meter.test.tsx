import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Meter } from './Meter';

describe('Meter', () => {
  it('exposes role=meter with aria value attributes', () => {
    render(<Meter label="Disk" value={30} min={0} max={100} />);
    const m = screen.getByRole('meter', { name: 'Disk' });
    expect(m).toHaveAttribute('aria-valuenow', '30');
    expect(m).toHaveAttribute('aria-valuemin', '0');
    expect(m).toHaveAttribute('aria-valuemax', '100');
  });
  it('uses aria-valuetext from formatValue and shows it when showValue', () => {
    render(<Meter label="D" value={42} formatValue={(v) => `${v}%`} showValue />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '42%');
    expect(screen.getByText('42%')).toBeInTheDocument();
  });
  // optimum below low => lower is better. value in low band = good, high band = poor.
  it('derives tone good/caution/poor from thresholds (lower-is-better)', () => {
    const { rerender } = render(
      <Meter label="D" value={10} max={100} low={30} high={70} optimum={10} />,
    );
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'good');
    rerender(<Meter label="D" value={50} max={100} low={30} high={70} optimum={10} />);
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'caution');
    rerender(<Meter label="D" value={90} max={100} low={30} high={70} optimum={10} />);
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'poor');
  });
  it('is neutral when no thresholds are given', () => {
    render(<Meter label="D" value={50} />);
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'neutral');
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Meter, meterTone } from './Meter';

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

  it('clamps aria-valuenow into [min,max] for out-of-range and non-finite values', () => {
    const { rerender } = render(<Meter label="D" value={150} min={0} max={100} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
    rerender(<Meter label="D" value={-20} min={0} max={100} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');
    rerender(<Meter label="D" value={Number.NaN} min={0} max={100} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');
  });

  it('constrains low/high/optimum into [min,max] and holds low <= high before grading', () => {
    // optimum well above max is clamped to max => higher-is-better; high>max clamped to max.
    // value at max should grade good under the constrained bounds.
    expect(meterTone(100, 0, 100, 40, 200, 500)).toBe('good');
    // inverted bounds (low > high) are constrained so high becomes low; no crash, valid band.
    expect(['good', 'caution', 'poor']).toContain(meterTone(50, 0, 100, 80, 20, 10));
  });

  describe('accessible-name dev warning', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });
    it('warns when no label/aria-label/aria-labelledby is provided', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Meter value={30} />);
      expect(warn).toHaveBeenCalledOnce();
    });
    it('does not warn when an aria-label is provided', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Meter value={30} aria-label="Disk" />);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  it('renders no empty placeholder span when only showValue is set', () => {
    const { container } = render(
      <Meter value={42} aria-label="D" formatValue={(v) => `${v}%`} showValue />,
    );
    // The label row holds exactly one child (the value), no empty placeholder.
    const value = screen.getByText('42%');
    const row = value.parentElement;
    expect(row).not.toBeNull();
    expect(row?.children).toHaveLength(1);
    // No stray empty span anywhere in the tree.
    const emptySpans = Array.from(container.querySelectorAll('span')).filter(
      (s) => s.textContent === '' && s.children.length === 0,
    );
    expect(emptySpans).toHaveLength(0);
  });
});

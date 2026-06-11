import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Rating } from './Rating';
import { FormField } from '../FormField';

describe('Rating', () => {
  it('renders a radiogroup with `max` radios (default 5)', () => {
    render(<Rating aria-label="Quality" />);
    expect(screen.getByRole('radiogroup', { name: 'Quality' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('honors a custom max', () => {
    render(<Rating max={3} />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the selected star checked and fills up to it (defaultValue)', () => {
    render(<Rating defaultValue={3} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('data-filled', 'true');
    expect(radios[1]).toHaveAttribute('data-filled', 'true');
    expect(radios[2]).toHaveAttribute('data-filled', 'true');
    expect(radios[3]).not.toHaveAttribute('data-filled');
  });

  it('selects on click and fires onChange (uncontrolled)', async () => {
    const onChange = vi.fn();
    render(<Rating onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'true');
  });

  it('supports arrow-key navigation with roving focus', async () => {
    const onChange = vi.fn();
    render(<Rating defaultValue={2} onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    radios[1]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith(1);
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('uses roving tabindex: only the active star is tabbable', () => {
    render(<Rating defaultValue={3} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[2]).toHaveAttribute('tabindex', '0');
    expect(radios[0]).toHaveAttribute('tabindex', '-1');
  });

  it('readOnly: does not select, sets aria-readonly, removes from tab order', async () => {
    const onChange = vi.fn();
    render(<Rating value={2} readOnly onChange={onChange} />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-readonly', 'true');
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('tabindex', '-1');
    await userEvent.click(radios[4]!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('controlled: respects value and does not self-update', async () => {
    const onChange = vi.fn();
    render(<Rating value={1} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole('radio', { name: '1 star' })).toHaveAttribute('aria-checked', 'true');
  });

  it('reflects size as a data attribute', () => {
    render(<Rating size="lg" />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-size', 'lg');
  });

  it('associates with FormField label, description, error, and required (group pattern)', () => {
    render(
      <FormField
        label="Satisfaction"
        helperText="Rate your experience"
        error
        errorText="Please rate us"
        required
      >
        <Rating />
      </FormField>,
    );
    const group = screen.getByRole('radiogroup');
    // Labelled by the FormField label, not the standalone aria-label.
    expect(group).not.toHaveAttribute('aria-label');
    const label = screen.getByText('Satisfaction');
    expect(group).toHaveAttribute('aria-labelledby', label.id);
    // Described by the FormField error message (error replaces helperText).
    const desc = screen.getByText('Please rate us');
    expect(group).toHaveAttribute('aria-describedby', desc.id);
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-required', 'true');
    expect(group).toHaveAttribute('id');
  });

  it('standalone (no FormField) keeps its aria-label and omits group associations', () => {
    render(<Rating aria-label="Quality" />);
    const group = screen.getByRole('radiogroup', { name: 'Quality' });
    expect(group).not.toHaveAttribute('aria-labelledby');
    expect(group).not.toHaveAttribute('aria-describedby');
    expect(group).not.toHaveAttribute('aria-invalid');
    expect(group).not.toHaveAttribute('aria-required');
  });
});

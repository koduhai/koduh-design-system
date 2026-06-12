import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stepper } from './Stepper';

const STEPS = [
  { label: 'Account', description: 'Create credentials' },
  { label: 'Profile' },
  { label: 'Review' },
];

describe('Stepper', () => {
  it('renders an ordered list of steps with labels', () => {
    const { container } = render(<Stepper steps={STEPS} activeStep={1} />);
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('marks the active step with aria-current and reflects per-step state', () => {
    render(<Stepper steps={STEPS} activeStep={1} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('data-state', 'complete');
    expect(items[1]).toHaveAttribute('data-state', 'active');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).toHaveAttribute('data-state', 'upcoming');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('exposes completion as accessible text (not colour/shape only)', () => {
    render(<Stepper steps={STEPS} activeStep={2} />);
    expect(screen.getAllByText(/\(completed\)/)).toHaveLength(2);
  });

  it('defaults to horizontal orientation and reflects the override', () => {
    const { container, rerender } = render(<Stepper steps={STEPS} activeStep={0} />);
    expect(container.querySelector('ol')).toHaveAttribute('data-orientation', 'horizontal');
    rerender(<Stepper steps={STEPS} activeStep={0} orientation="vertical" />);
    expect(container.querySelector('ol')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('renders completed/visited steps as buttons and calls onStepClick', async () => {
    const onStepClick = vi.fn();
    render(<Stepper steps={STEPS} activeStep={1} onStepClick={onStepClick} />);
    // Steps 0 (complete) and 1 (active/visited) are buttons; step 2 is not.
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]!);
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it('puts aria-current on the active step button (not the list item) when interactive', () => {
    render(<Stepper steps={STEPS} activeStep={1} onStepClick={() => {}} />);
    const items = screen.getAllByRole('listitem');
    // The active step is interactive, so aria-current moves to the button.
    expect(items[1]).not.toHaveAttribute('aria-current');
    const activeButton = screen.getByRole('button', { name: /Profile/ });
    expect(activeButton).toHaveAttribute('aria-current', 'step');
  });

  it('does not render buttons without onStepClick', () => {
    render(<Stepper steps={STEPS} activeStep={2} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('forwards className and DOM props to the root', () => {
    const { container } = render(
      <Stepper
        steps={STEPS}
        activeStep={0}
        className="extra"
        data-testid="sx"
        aria-label="Setup"
      />,
    );
    const ol = container.querySelector('ol')!;
    expect(ol).toHaveClass('extra');
    expect(ol).toHaveAttribute('data-testid', 'sx');
    expect(ol).toHaveAttribute('aria-label', 'Setup');
  });
});

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { VisuallyHidden } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Stepper.module.css';

export type StepperOrientation = 'horizontal' | 'vertical';

export interface StepperStep {
  /** The step's label. */
  label: ReactNode;
  /** Optional secondary description shown under the label. */
  description?: ReactNode;
}

export type StepState = 'complete' | 'active' | 'upcoming';

export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
  /** The ordered set of steps to render. */
  steps: StepperStep[];
  /** Zero-based index of the active step. */
  activeStep: number;
  /** Layout direction. Defaults to 'horizontal'. */
  orientation?: StepperOrientation;
  /**
   * When provided, completed and visited steps render as buttons that call this
   * with the step index. Upcoming (future) steps stay non-interactive.
   */
  onStepClick?: (index: number) => void;
}

function stateFor(index: number, activeStep: number): StepState {
  if (index < activeStep) return 'complete';
  if (index === activeStep) return 'active';
  return 'upcoming';
}

export const Stepper = /* @__PURE__ */ forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  { steps, activeStep, orientation = 'horizontal', onStepClick, className, ...props },
  ref,
) {
  return (
    <ol ref={ref} className={cx(styles.root, className)} data-orientation={orientation} {...props}>
      {steps.map((step, index) => {
        const state = stateFor(index, activeStep);
        const isComplete = state === 'complete';
        const isActive = state === 'active';
        // Completed or visited (active) steps are clickable when a handler is set.
        const clickable = onStepClick != null && index <= activeStep;

        const indicator = (
          <span className={styles.indicator} aria-hidden>
            {isComplete ? (
              <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
                <path
                  d="M13.5 4.5 6.5 11.5 2.5 7.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <span className={styles.number}>{index + 1}</span>
            )}
          </span>
        );

        const body = (
          <span className={styles.text}>
            <span className={styles.label}>
              {step.label}
              {isComplete ? <VisuallyHidden> (completed)</VisuallyHidden> : null}
            </span>
            {step.description != null ? (
              <span className={styles.description}>{step.description}</span>
            ) : null}
          </span>
        );

        return (
          <li
            key={index}
            className={styles.step}
            data-state={state}
            aria-current={isActive ? 'step' : undefined}
          >
            {clickable ? (
              <button type="button" className={styles.trigger} onClick={() => onStepClick(index)}>
                {indicator}
                {body}
              </button>
            ) : (
              <span className={styles.content}>
                {indicator}
                {body}
              </span>
            )}
            {index < steps.length - 1 ? <span className={styles.connector} aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
});

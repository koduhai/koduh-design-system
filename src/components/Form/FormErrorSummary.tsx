import { forwardRef, useEffect, useRef, useSyncExternalStore } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useId, mergeRefs } from '../../primitives';
import { cx } from '../../utils/cx';
import { useFormContext } from './FormContext';
import styles from './FormErrorSummary.module.css';

export interface FormErrorSummaryProps extends HTMLAttributes<HTMLDivElement> {
  /** Heading text for the summary region. */
  heading?: ReactNode;
}

export const FormErrorSummary = /* @__PURE__ */ forwardRef<HTMLDivElement, FormErrorSummaryProps>(
  function FormErrorSummary({ heading = 'There is a problem', className, ...props }, ref) {
    const api = useFormContext();
    const errors = useSyncExternalStore(
      api.subscribe,
      () => api.getSnapshot().errors,
      () => api.getSnapshot().errors,
    );
    // Track submit attempts so we only steal focus in response to a failed submit
    // (not when errors appear from onChange/onBlur validation while typing).
    const submitCount = useSyncExternalStore(
      api.subscribe,
      () => api.getSnapshot().submitCount,
      () => api.getSnapshot().submitCount,
    );
    const headingId = useId('error-summary');
    const containerRef = useRef<HTMLDivElement>(null);
    const lastFocusedSubmit = useRef(0);

    const entries = Object.entries(errors);
    const hasErrors = entries.length > 0;

    // GOV.UK / WAI error-summary pattern: on a failed submit, move focus to the
    // summary container so the heading + list are announced in order. We focus
    // once per submit attempt (guarded by submitCount) rather than relying solely
    // on role="alert".
    useEffect(() => {
      if (hasErrors && submitCount > lastFocusedSubmit.current) {
        lastFocusedSubmit.current = submitCount;
        containerRef.current?.focus();
      }
    }, [hasErrors, submitCount]);

    if (!hasErrors) return null;

    return (
      // A labelled, focusable region (not role="alert"): a container of focusable
      // links shouldn't be a live region, and moving focus here announces it.
      <div
        ref={mergeRefs(containerRef, ref)}
        role="group"
        tabIndex={-1}
        aria-labelledby={headingId}
        className={cx(styles.root, className)}
        {...props}
      >
        <p id={headingId} className={styles.heading}>
          {heading}
        </p>
        <ul className={styles.list}>
          {entries.map(([name, message]) => {
            const id = api.getFieldId(name);
            return (
              <li key={name}>
                {id ? (
                  // Actionable link: jumps focus to the field's control.
                  <a
                    className={styles.link}
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      api.focusField(name);
                    }}
                  >
                    {message}
                  </a>
                ) : (
                  // No registered DOM id (e.g. a resolver-level error with no bound
                  // input): plain text, not a dead/unfocusable <a href={undefined}>.
                  <span className={styles.text}>{message}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);

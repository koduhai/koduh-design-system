import { forwardRef, useSyncExternalStore } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useId } from '../../primitives';
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
    const headingId = useId('error-summary');
    const entries = Object.entries(errors);
    if (entries.length === 0) return null;

    return (
      <div
        ref={ref}
        role="alert"
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
                <a
                  className={styles.link}
                  href={id ? `#${id}` : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    api.focusField(name);
                  }}
                >
                  {message}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);

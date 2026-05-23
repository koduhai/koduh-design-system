import { forwardRef, createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './EmptyState.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Decorative illustration or icon shown above the title. */
  icon?: ReactNode;
  /** Heading text. Required. */
  title: ReactNode;
  /** Supporting copy shown below the title. */
  description?: ReactNode;
  /** Call-to-action — pass a real <Button>/<a>. */
  action?: ReactNode;
  /** Semantic heading level for the title. Defaults to 2. */
  headingLevel?: HeadingLevel;
}

export const EmptyState = /* @__PURE__ */ forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    { icon, title, description, action, headingLevel = 2, className, ...props },
    ref,
  ) {
    return (
      <div ref={ref} className={cx(styles.root, className)} {...props}>
        {icon ? (
          <div className={styles.icon} aria-hidden="true">
            {icon}
          </div>
        ) : null}
        {createElement(`h${headingLevel}`, { className: styles.title }, title)}
        {description ? <p className={styles.description}>{description}</p> : null}
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
    );
  },
);

import { forwardRef, createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './PageHeader.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Page or section title. Required. */
  title: ReactNode;
  /** Supporting line shown beneath the title. */
  subtitle?: ReactNode;
  /** Breadcrumb trail — rendered inside <nav aria-label="Breadcrumb">. */
  breadcrumbs?: ReactNode;
  /** Right-aligned actions (buttons, menus). */
  actions?: ReactNode;
  /** Semantic heading level for the title. Defaults to 1. */
  headingLevel?: HeadingLevel;
}

export const PageHeader = /* @__PURE__ */ forwardRef<HTMLElement, PageHeaderProps>(
  function PageHeader(
    { title, subtitle, breadcrumbs, actions, headingLevel = 1, className, ...props },
    ref,
  ) {
    return (
      <header ref={ref} className={cx(styles.root, className)} {...props}>
        {breadcrumbs ? (
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            {breadcrumbs}
          </nav>
        ) : null}
        <div className={styles.bar}>
          <div className={styles.titles}>
            {createElement(`h${headingLevel}`, { className: styles.title }, title)}
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      </header>
    );
  },
);

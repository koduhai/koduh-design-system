import { forwardRef, createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Breadcrumbs } from '../Breadcrumbs';
import type { BreadcrumbItem } from '../Breadcrumbs';
import type { HeadingLevel } from '../../utils/headingLevel';
import styles from './PageHeader.module.css';

export type { HeadingLevel };

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Page or section title. Required. */
  title: ReactNode;
  /** Supporting line shown beneath the title. */
  subtitle?: ReactNode;
  /**
   * Breadcrumb trail. An array of `BreadcrumbItem` renders a single internal
   * `<Breadcrumbs>` (one nav landmark). A `ReactNode` is rendered as-is — it
   * owns its own landmark and is NOT wrapped in a `<nav>` (so passing your own
   * `<Breadcrumbs>` won't create a nested duplicate nav).
   */
  breadcrumbs?: BreadcrumbItem[] | ReactNode;
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
        {breadcrumbs != null ? (
          Array.isArray(breadcrumbs) ? (
            <Breadcrumbs className={styles.breadcrumbs} items={breadcrumbs as BreadcrumbItem[]} />
          ) : (
            <div className={styles.breadcrumbs}>{breadcrumbs}</div>
          )
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

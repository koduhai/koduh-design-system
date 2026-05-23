import { forwardRef, Fragment } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { ChevronDownIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: ReactNode;
  /** Last item typically has no href (current page). */
  href?: string;
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  /** Separator between items. Defaults to a chevron icon. */
  separator?: ReactNode;
  /** Collapse middle items when more than this many. */
  maxItems?: number;
}

/** Sentinel used to mark the collapsed ellipsis position. */
const ELLIPSIS = '…';

export const Breadcrumbs = /* @__PURE__ */ forwardRef<HTMLElement, BreadcrumbsProps>(
  function Breadcrumbs({ items, separator, maxItems, className, ...props }, ref) {
    const defaultSeparator = <ChevronDownIcon className={styles.chevron} size={16} aria-hidden />;
    const sep = separator ?? defaultSeparator;

    // Build the visible item list, optionally collapsing the middle.
    type RenderItem = { kind: 'item'; item: BreadcrumbItem } | { kind: 'ellipsis' };
    let rendered: RenderItem[];

    if (maxItems != null && items.length > maxItems && maxItems >= 1) {
      const tailCount = Math.max(0, maxItems - 2);
      // Guarded by items.length > maxItems >= 1, so items[0] is defined.
      const first = items[0]!;
      const tail = tailCount > 0 ? items.slice(items.length - tailCount) : [];
      rendered = [
        { kind: 'item', item: first },
        { kind: 'ellipsis' },
        ...tail.map((item): RenderItem => ({ kind: 'item', item })),
      ];
    } else {
      rendered = items.map((item): RenderItem => ({ kind: 'item', item }));
    }

    const lastIndex = rendered.length - 1;

    return (
      <nav ref={ref} aria-label="Breadcrumb" className={cx(styles.root, className)} {...props}>
        <ol className={styles.list}>
          {rendered.map((entry, index) => {
            const isLast = index === lastIndex;
            const separatorNode = !isLast ? (
              <span className={styles.separator} aria-hidden="true">
                {sep}
              </span>
            ) : null;

            if (entry.kind === 'ellipsis') {
              return (
                <Fragment key={`ellipsis-${index}`}>
                  <li className={styles.item}>
                    <span className={styles.ellipsis}>{ELLIPSIS}</span>
                  </li>
                  {separatorNode}
                </Fragment>
              );
            }

            const { item } = entry;
            const isCurrent = isLast || item.href == null;

            return (
              <Fragment key={index}>
                <li className={styles.item}>
                  {item.href != null && !isCurrent ? (
                    <a className={styles.link} href={item.href}>
                      {item.label}
                    </a>
                  ) : (
                    <span className={styles.current} aria-current="page">
                      {item.label}
                    </span>
                  )}
                </li>
                {separatorNode}
              </Fragment>
            );
          })}
        </ol>
      </nav>
    );
  },
);

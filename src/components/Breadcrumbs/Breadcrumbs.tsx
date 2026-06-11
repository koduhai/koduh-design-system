import { forwardRef, Fragment } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { ChevronDownIcon } from '../../icons';
import { VisuallyHidden } from '../../primitives/VisuallyHidden';
import { cx } from '../../utils/cx';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  /** Visible text (or node) for the breadcrumb step. */
  label: ReactNode;
  /** Last item typically has no href (current page). */
  href?: string;
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  /** Ordered list of breadcrumb steps, first → last (current page). */
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
    type RenderItem = { kind: 'item'; item: BreadcrumbItem } | { kind: 'ellipsis'; hidden: number };
    let rendered: RenderItem[];

    if (maxItems != null && items.length > maxItems && maxItems >= 1) {
      // Always keep the first item and the last (current) item, plus an
      // ellipsis between them. Any remaining budget shows trailing items just
      // before the last one. Clamped so a tiny maxItems still renders a
      // coherent trail (first, ellipsis, last).
      // Guarded by items.length > maxItems >= 1, so items[0] is defined.
      const first = items[0]!;
      const last = items[items.length - 1]!;
      // Reserve two slots for first and last; the rest are trailing items.
      const tailCount = Math.max(0, maxItems - 2);
      // Slice the trailing items between the ellipsis and the last item.
      const tail = tailCount > 0 ? items.slice(items.length - 1 - tailCount, items.length - 1) : [];
      // Count the items folded into the ellipsis (everything except first,
      // last, and the shown trailing items) so assistive tech can announce it.
      const hidden = items.length - 2 - tail.length;
      rendered = [
        { kind: 'item', item: first },
        { kind: 'ellipsis', hidden },
        ...tail.map((item): RenderItem => ({ kind: 'item', item })),
        { kind: 'item', item: last },
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
                    <span className={styles.ellipsis} aria-hidden="true">
                      {ELLIPSIS}
                    </span>
                    <VisuallyHidden>
                      {entry.hidden === 1
                        ? '1 more breadcrumb'
                        : `${entry.hidden} more breadcrumbs`}
                    </VisuallyHidden>
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
                  {!isCurrent ? (
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

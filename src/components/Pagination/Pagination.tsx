import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { useMessages } from '../../i18n';
import { cx } from '../../utils/cx';
import { getPaginationRange } from './getPaginationRange';
import styles from './Pagination.module.css';

/** The kind of control an aria-label is being generated for. */
export type PaginationItemType = 'page' | 'previous' | 'next';

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Total number of pages (>= 1). */
  count: number;
  /** Current page, 1-based. */
  page: number;
  /** Fires with the requested page. */
  onPageChange?: (page: number) => void;
  /** Pages shown on each side of the current page. Default 1. */
  siblingCount?: number;
  /** Pages shown at each end. Default 1. */
  boundaryCount?: number;
  /** Disables all controls. */
  disabled?: boolean;
  /** Accessible label for the Previous control. Defaults to the i18n catalog's `pagination.previous` ('Previous page'). */
  previousLabel?: string;
  /** Accessible label for the Next control. Defaults to the i18n catalog's `pagination.next` ('Next page'). */
  nextLabel?: string;
  /**
   * Formats the accessible label for each control, for localization. When
   * omitted, the i18n catalog defaults are used (`pagination.page`/`current`
   * for page buttons, `pagination.previous`/`next` for the arrows). For
   * `'previous'`/`'next'`, `page` is the target page the control navigates to.
   */
  getItemAriaLabel?: (type: PaginationItemType, page: number) => string;
}

export const Pagination = /* @__PURE__ */ forwardRef<HTMLElement, PaginationProps>(
  function Pagination(
    {
      count,
      page,
      onPageChange,
      siblingCount = 1,
      boundaryCount = 1,
      disabled = false,
      previousLabel,
      nextLabel,
      getItemAriaLabel,
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) {
    const messages = useMessages();
    const items = getPaginationRange({ count, page, siblingCount, boundaryCount });

    const go = (target: number) => {
      if (disabled || target < 1 || target > count || target === page) return;
      onPageChange?.(target);
    };

    const labelFor = (type: PaginationItemType, target: number, fallback: string) =>
      getItemAriaLabel ? getItemAriaLabel(type, target) : fallback;

    return (
      <nav
        ref={ref}
        className={cx(styles.root, className)}
        aria-label={ariaLabel ?? messages.pagination.label}
        {...props}
      >
        <ul className={styles.list}>
          <li>
            <button
              type="button"
              className={styles.item}
              aria-label={labelFor(
                'previous',
                page - 1,
                previousLabel ?? messages.pagination.previous,
              )}
              disabled={disabled || page <= 1}
              onClick={() => go(page - 1)}
            >
              <span className={styles.chevron} aria-hidden="true">
                ‹
              </span>
            </button>
          </li>
          {items.map((item, index) =>
            item === 'ellipsis' ? (
              <li key={`ellipsis-${index}`}>
                <span className={styles.ellipsis} aria-hidden="true">
                  …
                </span>
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className={styles.item}
                  aria-label={labelFor(
                    'page',
                    item,
                    item === page
                      ? messages.pagination.current(item)
                      : messages.pagination.page(item),
                  )}
                  aria-current={item === page ? 'page' : undefined}
                  data-current={item === page ? 'true' : undefined}
                  disabled={disabled}
                  onClick={() => go(item)}
                >
                  {item}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              className={styles.item}
              aria-label={labelFor('next', page + 1, nextLabel ?? messages.pagination.next)}
              disabled={disabled || page >= count}
              onClick={() => go(page + 1)}
            >
              <span className={styles.chevron} aria-hidden="true">
                ›
              </span>
            </button>
          </li>
        </ul>
      </nav>
    );
  },
);

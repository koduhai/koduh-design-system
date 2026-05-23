import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import { getPaginationRange } from './getPaginationRange';
import styles from './Pagination.module.css';

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
      className,
      'aria-label': ariaLabel = 'Pagination',
      ...props
    },
    ref,
  ) {
    const items = getPaginationRange({ count, page, siblingCount, boundaryCount });

    const go = (target: number) => {
      if (disabled || target < 1 || target > count || target === page) return;
      onPageChange?.(target);
    };

    return (
      <nav ref={ref} className={cx(styles.root, className)} aria-label={ariaLabel} {...props}>
        <ul className={styles.list}>
          <li>
            <button
              type="button"
              className={styles.item}
              aria-label="Previous page"
              disabled={disabled || page <= 1}
              onClick={() => go(page - 1)}
            >
              ‹
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
                  aria-label={`Go to page ${item}`}
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
              aria-label="Next page"
              disabled={disabled || page >= count}
              onClick={() => go(page + 1)}
            >
              ›
            </button>
          </li>
        </ul>
      </nav>
    );
  },
);

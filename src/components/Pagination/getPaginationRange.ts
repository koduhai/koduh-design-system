export type PaginationItem = number | 'ellipsis';

export interface PaginationRangeOptions {
  /** Total number of pages (>= 1). */
  count: number;
  /** Current page, 1-based. */
  page: number;
  /** Pages shown on each side of the current page. Default 1. */
  siblingCount?: number;
  /** Pages shown at each end. Default 1. */
  boundaryCount?: number;
}

const range = (start: number, end: number): number[] =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);

/**
 * Computes the ordered list of page numbers and ellipsis markers to render.
 * Mirrors the well-known MUI usePagination algorithm: a one-page gap is
 * rendered as the page itself rather than an ellipsis.
 */
export function getPaginationRange({
  count,
  page,
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationRangeOptions): PaginationItem[] {
  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  // Clamp the sibling window so that the total number of rendered items stays
  // stable when the current page approaches either boundary. The offsets
  // `boundaryCount + siblingCount * 2 + 2` account for both boundary pages,
  // both sibling wings, and the two potential ellipsis slots, ensuring the
  // window shifts rather than shrinks.
  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? (endPages[0] as number) - 2 : count - 1,
  );

  return [
    ...startPages,
    // If the gap between the start boundary and the sibling window is exactly
    // one page, render that page directly instead of an ellipsis (an ellipsis
    // hiding a single page would be misleading and wastes space).
    ...(siblingsStart > boundaryCount + 2
      ? ['ellipsis' as const]
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    // Same one-page-gap rule applied to the trailing side.
    ...(siblingsEnd < count - boundaryCount - 1
      ? ['ellipsis' as const]
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),
    ...endPages,
  ];
}

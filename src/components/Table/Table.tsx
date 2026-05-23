import { forwardRef } from 'react';
import type { ForwardedRef, HTMLAttributes, ReactNode, Ref } from 'react';
import { Checkbox } from '../Checkbox';
import { Skeleton } from '../Skeleton';
import { VisuallyHidden } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Table.module.css';

export type SortDirection = 'asc' | 'desc';
export type CellAlign = 'start' | 'center' | 'end';

export interface Column<Row> {
  /** Stable identity; also the default sort key. */
  key: string;
  /** Header cell content. */
  header: ReactNode;
  /** Custom cell renderer. Defaults to `String(row[key])` when key indexes Row. */
  render?: (row: Row, rowIndex: number) => ReactNode;
  /** Cell text alignment. Default 'start'. */
  align?: CellAlign;
  /** Any CSS width applied to the column. */
  width?: string;
  /** Makes the header a sort control. Default false. */
  sortable?: boolean;
}

export interface TableProps<Row> extends Omit<HTMLAttributes<HTMLTableElement>, 'children'> {
  columns: Column<Row>[];
  data: Row[];
  getRowId: (row: Row) => string;
  /** Accessible name; visually hidden unless `captionVisible`. */
  caption?: ReactNode;
  captionVisible?: boolean;
  /** Controlled sort key. */
  sortKey?: string;
  /** Controlled sort direction. */
  sortDir?: SortDirection;
  /** Fires with the requested sort key + toggled direction. */
  onSortChange?: (key: string, dir: SortDirection) => void;
  /** Controlled selected row ids. */
  selectedIds?: string[];
  /**
   * Fires with the next selected id set. Select-all operates over the current
   * `data` only: it emits exactly the current rows' ids (or `[]` to clear), so
   * a paginated consumer should merge with selections from other pages itself.
   */
  onSelectionChange?: (ids: string[]) => void;
  /** Renders skeleton rows in place of data. */
  loading?: boolean;
  /** Number of skeleton rows. Default 5. */
  loadingRows?: number;
  /** Shown when `data` is empty and not loading. */
  empty?: ReactNode;
  /** Sticky header for scroll-in-container. */
  stickyHeader?: boolean;
}

function TableInner<Row>(
  {
    columns,
    data,
    getRowId,
    caption,
    captionVisible = false,
    sortKey,
    sortDir,
    onSortChange,
    selectedIds,
    onSelectionChange,
    loading = false,
    loadingRows = 5,
    empty,
    stickyHeader = false,
    className,
    ...props
  }: TableProps<Row>,
  ref: ForwardedRef<HTMLTableElement>,
) {
  const selectable = selectedIds != null && onSelectionChange != null;
  const selectedSet = new Set(selectedIds ?? []);
  const allIds = data.map(getRowId);
  const allSelected = selectable && allIds.length > 0 && allIds.every((id) => selectedSet.has(id));
  const someSelected = selectable && allIds.some((id) => selectedSet.has(id)) && !allSelected;
  const totalCols = columns.length + (selectable ? 1 : 0);

  const handleSort = (col: Column<Row>) => {
    if (!col.sortable || !onSortChange) return;
    const nextDir: SortDirection = sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc';
    onSortChange(col.key, nextDir);
  };

  const toggleAll = () => {
    onSelectionChange?.(allSelected ? [] : allIds);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange?.([...next]);
  };

  const ariaSort = (col: Column<Row>): 'ascending' | 'descending' | 'none' | undefined => {
    if (!col.sortable) return undefined;
    if (sortKey !== col.key) return 'none';
    return sortDir === 'desc' ? 'descending' : 'ascending';
  };

  return (
    <table
      ref={ref}
      className={cx(styles.root, className)}
      data-sticky={stickyHeader ? 'true' : undefined}
      {...props}
    >
      {caption != null ? (
        <caption className={styles.caption}>
          {captionVisible ? caption : <VisuallyHidden>{caption}</VisuallyHidden>}
        </caption>
      ) : null}
      <thead className={styles.thead}>
        <tr>
          {selectable ? (
            <th scope="col" className={styles.th} data-select="true">
              <Checkbox
                aria-label="Select all rows"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
              />
            </th>
          ) : null}
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              className={styles.th}
              data-align={col.align ?? 'start'}
              aria-sort={ariaSort(col)}
              style={col.width ? { width: col.width } : undefined}
            >
              {col.sortable ? (
                <button
                  type="button"
                  className={styles.sortButton}
                  onClick={() => handleSort(col)}
                  data-active={sortKey === col.key ? 'true' : undefined}
                >
                  {col.header}
                  <span
                    className={styles.sortIcon}
                    aria-hidden="true"
                    data-dir={sortKey === col.key ? sortDir : undefined}
                  />
                </button>
              ) : (
                col.header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: loadingRows }).map((_, r) => (
            <tr key={`skeleton-${r}`}>
              {Array.from({ length: totalCols }).map((__, c) => (
                <td key={c} className={styles.td}>
                  <Skeleton />
                </td>
              ))}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr>
            <td className={styles.emptyCell} colSpan={totalCols}>
              {empty}
            </td>
          </tr>
        ) : (
          data.map((row, rowIndex) => {
            const id = getRowId(row);
            const isSelected = selectedSet.has(id);
            return (
              <tr key={id} className={styles.tr} data-selected={isSelected ? 'true' : undefined}>
                {selectable ? (
                  <td className={styles.td} data-select="true">
                    <Checkbox
                      aria-label={`Select row ${id}`}
                      checked={isSelected}
                      onChange={() => toggleRow(id)}
                    />
                  </td>
                ) : null}
                {columns.map((col) => (
                  <td key={col.key} className={styles.td} data-align={col.align ?? 'start'}>
                    {col.render
                      ? col.render(row, rowIndex)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

// Generic forwardRef: cast preserves the <Row> type parameter at the call site.
export const Table = /* @__PURE__ */ forwardRef(TableInner) as <Row>(
  props: TableProps<Row> & { ref?: Ref<HTMLTableElement> },
) => ReturnType<typeof TableInner>;

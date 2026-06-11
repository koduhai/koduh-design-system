import { forwardRef } from 'react';
import type { ForwardedRef, HTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { Checkbox } from '../Checkbox';
import { Skeleton } from '../Skeleton';
import { VisuallyHidden } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Table.module.css';

/**
 * Density of a data-dense surface. Mirrors the `[data-density]` token mechanism
 * (`--ku-density-*` vars). `comfortable` is the default; `compact` tightens
 * internal padding / row height (never the interactive hit-target). The same
 * literal is used by TextField/Select/Menu.
 */
export type Density = 'comfortable' | 'compact';

export type SortDirection = 'asc' | 'desc';
export interface SortRule {
  key: string;
  dir: SortDirection;
}
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
  /** Column definitions; order matches the rendered column order. */
  columns: Column<Row>[];
  /** Rows to render. An empty array triggers the `empty` slot. */
  data: Row[];
  /** Returns a stable unique string id for each row (used as React key and selection id). */
  getRowId: (row: Row) => string;
  /** Accessible name; visually hidden unless `captionVisible`. */
  caption?: ReactNode;
  /** When true, renders the caption visibly above the table. Defaults to false. */
  captionVisible?: boolean;
  /** Controlled sort key. */
  sortKey?: string;
  /** Controlled sort direction. */
  sortDir?: SortDirection;
  /** Fires with the requested sort key, toggled direction, and the originating event. */
  onSortChange?: (key: string, dir: SortDirection, event?: MouseEvent) => void;
  /**
   * Multi-column sort rules in priority order. When provided, takes precedence
   * over `sortKey`/`sortDir` and renders an `aria-sort` + priority badge per
   * sorted column. Omit to keep the single-column `sortKey`/`sortDir` behavior.
   */
  sort?: SortRule[];
  /** Controlled selected row ids. */
  selectedIds?: string[];
  /**
   * Fires with the next selected id set. When `selectAllIds` is omitted, select-all
   * emits the current page's row ids; when `selectAllIds` is provided it emits that
   * set instead — so a paginated consumer can select across pages.
   */
  onSelectionChange?: (ids: string[]) => void;
  /**
   * When provided, the header select-all checkbox reflects/toggles THIS id set
   * (e.g. all rows across pages) instead of only the rendered `data`.
   */
  selectAllIds?: string[];
  /** Renders skeleton rows in place of data. */
  loading?: boolean;
  /** Number of skeleton rows. Default 5. */
  loadingRows?: number;
  /** Shown when `data` is empty and not loading. */
  empty?: ReactNode;
  /** Sticky header for scroll-in-container. */
  stickyHeader?: boolean;
  /**
   * Row/cell density. `compact` tightens cell padding via the `--ku-density-*`
   * vars. Omit to inherit a `data-density` set on an ancestor (defaults to
   * comfortable). Setting it explicitly sets `data-density` on the table.
   */
  density?: Density;
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
    sort,
    selectedIds,
    onSelectionChange,
    selectAllIds,
    loading = false,
    loadingRows = 5,
    empty,
    stickyHeader = false,
    density,
    className,
    ...props
  }: TableProps<Row>,
  ref: ForwardedRef<HTMLTableElement>,
) {
  // Effective sort rules: explicit multi-sort wins; else derive from single sortKey/sortDir.
  const rules: SortRule[] = sort ?? (sortKey ? [{ key: sortKey, dir: sortDir ?? 'asc' }] : []);
  const ruleIndex = new Map(rules.map((r, i) => [r.key, i] as const));
  const ruleFor = (key: string) => {
    const i = ruleIndex.get(key);
    return i === undefined ? undefined : { rule: rules[i]!, index: i };
  };

  const selectable = selectedIds != null && onSelectionChange != null;
  const selectedSet = new Set(selectedIds ?? []);
  const allIds = data.map(getRowId);
  const selectAllTarget = selectAllIds ?? allIds;
  const allSelected =
    selectable && selectAllTarget.length > 0 && selectAllTarget.every((id) => selectedSet.has(id));
  const someSelected =
    selectable && selectAllTarget.some((id) => selectedSet.has(id)) && !allSelected;
  const totalCols = columns.length + (selectable ? 1 : 0);

  const handleSort = (col: Column<Row>, event: MouseEvent) => {
    if (!col.sortable || !onSortChange) return;
    const found = ruleFor(col.key);
    const nextDir: SortDirection = found?.rule.dir === 'asc' ? 'desc' : 'asc';
    onSortChange(col.key, nextDir, event);
  };

  const toggleAll = () => {
    onSelectionChange?.(allSelected ? [] : selectAllTarget);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange?.([...next]);
  };

  // A column is only operable as a sort control when both `sortable` is set and a
  // handler exists; otherwise rendering a focusable button + aria-sort + caret would
  // advertise an interaction that does nothing.
  const isSortable = (col: Column<Row>) => Boolean(col.sortable) && onSortChange != null;

  const ariaSort = (col: Column<Row>): 'ascending' | 'descending' | 'none' | undefined => {
    if (!isSortable(col)) return undefined;
    const found = ruleFor(col.key);
    if (!found) return 'none';
    return found.rule.dir === 'desc' ? 'descending' : 'ascending';
  };

  return (
    <table
      ref={ref}
      className={cx(styles.root, className)}
      data-sticky={stickyHeader ? 'true' : undefined}
      data-density={density}
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
          {columns.map((col) => {
            const found = ruleFor(col.key);
            return (
              <th
                key={col.key}
                scope="col"
                className={styles.th}
                data-align={col.align ?? 'start'}
                aria-sort={ariaSort(col)}
                style={col.width ? { width: col.width } : undefined}
              >
                {isSortable(col) ? (
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={(event) => handleSort(col, event)}
                    data-active={found ? 'true' : undefined}
                  >
                    {col.header}
                    {rules.length > 1 && found ? (
                      <span className={styles.sortPriority} aria-hidden="true">
                        {found.index + 1}
                      </span>
                    ) : null}
                    <span
                      className={styles.sortIcon}
                      aria-hidden="true"
                      data-dir={found?.rule.dir}
                    />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            );
          })}
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

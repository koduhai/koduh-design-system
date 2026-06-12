import { useState } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import type { Column, SortDirection, SortRule } from '../Table';
import { Checkbox } from '../Checkbox';
import { Skeleton } from '../Skeleton';
import { VisuallyHidden } from '../../primitives';
import { useMessages } from '../../i18n';
import tableStyles from '../Table/Table.module.css';
import styles from './DataTable.module.css';

interface VirtualizedTableProps<Row> {
  /** Resolved table columns (resize headers already baked in by DataTable). */
  columns: Column<Row>[];
  getRowId: (row: Row) => string;
  /** The FULL sorted/filtered result set — windowed here, not pre-sliced. */
  data: Row[];
  caption?: ReactNode;
  captionVisible?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  loadingRows: number;
  empty: ReactNode;
  sort: SortRule[];
  onSortChange: (key: string, dir: SortDirection, event: MouseEvent) => void;
  selectedIds: string[];
  selectAllIds: string[];
  onSelectionChange: (ids: string[]) => void;
  rowHeight: number;
  viewportHeight: number;
  overscan: number;
}

const SPACER_CELL: CSSProperties = { padding: 0, border: 0 };

/**
 * Windowed table body for very large client-side datasets. Renders only the
 * visible row window (plus overscan) between two spacer `<tr>`s sized to the
 * off-screen rows, which keeps the `<table>` semantics and the scrollbar correct.
 * `aria-rowcount`/`aria-rowindex` convey the true row count to assistive tech
 * despite the partial DOM. Mirrors the base `Table`'s header/row markup (it owns
 * its own markup, like `ExpandableTable`) so styling stays identical.
 */
export function VirtualizedTable<Row>({
  columns,
  getRowId,
  data,
  caption,
  captionVisible,
  stickyHeader,
  loading,
  loadingRows,
  empty,
  sort,
  onSortChange,
  selectedIds,
  selectAllIds,
  onSelectionChange,
  rowHeight,
  viewportHeight,
  overscan,
}: VirtualizedTableProps<Row>) {
  const messages = useMessages();
  const [scrollTop, setScrollTop] = useState(0);

  // Sort wiring (mirrors Table).
  const ruleIndex = new Map(sort.map((r, i) => [r.key, i] as const));
  const ruleFor = (key: string) => {
    const i = ruleIndex.get(key);
    return i === undefined ? undefined : { rule: sort[i]!, index: i };
  };
  const isSortable = (col: Column<Row>) => Boolean(col.sortable);
  const ariaSort = (col: Column<Row>): 'ascending' | 'descending' | 'none' | undefined => {
    if (!isSortable(col)) return undefined;
    const found = ruleFor(col.key);
    if (!found) return 'none';
    return found.rule.dir === 'desc' ? 'descending' : 'ascending';
  };
  const handleSort = (col: Column<Row>, event: MouseEvent) => {
    if (!col.sortable) return;
    const found = ruleFor(col.key);
    const nextDir: SortDirection = found?.rule.dir === 'asc' ? 'desc' : 'asc';
    onSortChange(col.key, nextDir, event);
  };

  // Selection (DataTable always wires selection through).
  const selectedSet = new Set(selectedIds);
  const allSelected = selectAllIds.length > 0 && selectAllIds.every((id) => selectedSet.has(id));
  const someSelected = selectAllIds.some((id) => selectedSet.has(id)) && !allSelected;
  const toggleAll = () => onSelectionChange(allSelected ? [] : selectAllIds);
  const toggleRow = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange([...next]);
  };
  const totalCols = columns.length + 1; // + the leading selection column

  // Windowing math.
  const count = data.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const endIndex = Math.min(count, startIndex + visibleCount);
  const topPad = startIndex * rowHeight;
  const bottomPad = Math.max(0, (count - endIndex) * rowHeight);
  const windowRows = data.slice(startIndex, endIndex);

  return (
    <div
      className={styles.virtualViewport}
      style={{ height: viewportHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* aria-rowcount counts the header row (1) + all data rows, so AT reports the
          true total even though only a window is in the DOM. */}
      <table
        className={tableStyles.root}
        data-sticky={stickyHeader ? 'true' : undefined}
        aria-rowcount={count + 1}
      >
        {caption != null ? (
          <caption className={tableStyles.caption}>
            {captionVisible ? caption : <VisuallyHidden>{caption}</VisuallyHidden>}
          </caption>
        ) : null}
        <thead className={tableStyles.thead}>
          <tr aria-rowindex={1}>
            <th scope="col" className={tableStyles.th} data-select="true">
              <Checkbox
                aria-label={messages.table.selectAll}
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
              />
            </th>
            {columns.map((col) => {
              const found = ruleFor(col.key);
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={tableStyles.th}
                  data-align={col.align ?? 'start'}
                  aria-sort={ariaSort(col)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {isSortable(col) ? (
                    <button
                      type="button"
                      className={tableStyles.sortButton}
                      onClick={(event) => handleSort(col, event)}
                      data-active={found ? 'true' : undefined}
                    >
                      {col.header}
                      {sort.length > 1 && found ? (
                        <span className={tableStyles.sortPriority} aria-hidden="true">
                          {found.index + 1}
                        </span>
                      ) : null}
                      <span
                        className={tableStyles.sortIcon}
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
              <tr key={`skeleton-${r}`} style={{ height: rowHeight }}>
                {Array.from({ length: totalCols }).map((__, c) => (
                  <td key={c} className={tableStyles.td}>
                    <Skeleton />
                  </td>
                ))}
              </tr>
            ))
          ) : count === 0 ? (
            <tr>
              <td className={tableStyles.emptyCell} colSpan={totalCols}>
                {empty}
              </td>
            </tr>
          ) : (
            <>
              {topPad > 0 ? (
                <tr aria-hidden="true" style={{ height: topPad }}>
                  <td colSpan={totalCols} style={SPACER_CELL} />
                </tr>
              ) : null}
              {windowRows.map((row, i) => {
                const absIndex = startIndex + i;
                const id = getRowId(row);
                const isSelected = selectedSet.has(id);
                return (
                  <tr
                    key={id}
                    className={tableStyles.tr}
                    data-selected={isSelected ? 'true' : undefined}
                    // +2: the header row is aria-rowindex 1, so data rows are 1-based + 1.
                    aria-rowindex={absIndex + 2}
                    style={{ height: rowHeight }}
                  >
                    <td className={tableStyles.td} data-select="true">
                      <Checkbox
                        aria-label={messages.table.selectRow(id)}
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                      />
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={tableStyles.td}
                        data-align={col.align ?? 'start'}
                      >
                        {col.render
                          ? col.render(row, absIndex)
                          : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {bottomPad > 0 ? (
                <tr aria-hidden="true" style={{ height: bottomPad }}>
                  <td colSpan={totalCols} style={SPACER_CELL} />
                </tr>
              ) : null}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

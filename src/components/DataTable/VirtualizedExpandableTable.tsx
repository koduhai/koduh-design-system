import { useCallback, useState } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import type { Column, SortDirection, SortRule } from '../Table';
import { Checkbox } from '../Checkbox';
import { useMessages } from '../../i18n';
import { ExpandedRowGroup } from './ExpandableTable';
import { useDynamicVirtualizer } from './useDynamicVirtualizer';
import type { DataColumn } from './types';
import styles from './DataTable.module.css';

interface VirtualizedExpandableTableProps<Row> {
  /** Resolved table columns (resize headers already baked in by DataTable). */
  columns: Column<Row>[];
  /** Original DataColumn defs, so per-column `render` is available for cells. */
  dataColumns: DataColumn<Row>[];
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
  expanded: string[];
  onExpandedChange: (ids: string[]) => void;
  renderExpanded: (row: Row) => ReactNode;
  /** Pre-measurement per-row height estimate (px). */
  estimateRowHeight: number;
  viewportHeight: number;
  overscan: number;
}

const SPACER_CELL: CSSProperties = { padding: 0, border: 0 };

/**
 * Windowed expandable table body: combines #37's row virtualization with
 * `renderExpanded`. Unlike the fixed-height `VirtualizedTable`, rows here have a
 * variable height (an expanded row grows by its detail panel), so windowing is
 * driven by `useDynamicVirtualizer` — heights are estimated up front and measured
 * once mounted (expanding a row grows its measured height, which feeds back into
 * the spacers and scrollbar).
 *
 * It mirrors `VirtualizedTable`'s viewport/spacer/aria contract:
 * `aria-rowcount={count+1}` on `<table>`, header `aria-rowindex={1}`, and data
 * main-rows `aria-rowindex={absIndex+2}`; detail rows are left out of the
 * rowindex sequence. The main+detail markup is `ExpandedRowGroup`, shared
 * verbatim with the paginated `ExpandableTable`.
 */
export function VirtualizedExpandableTable<Row>({
  columns,
  dataColumns,
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
  expanded,
  onExpandedChange,
  renderExpanded,
  estimateRowHeight,
  viewportHeight,
  overscan,
}: VirtualizedExpandableTableProps<Row>) {
  const messages = useMessages();
  const [scrollTop, setScrollTop] = useState(0);

  // Sort wiring (mirrors Table / VirtualizedTable).
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
  const expandedSet = new Set(expanded);
  const allSelected = selectAllIds.length > 0 && selectAllIds.every((id) => selectedSet.has(id));
  const someSelected = selectAllIds.some((id) => selectedSet.has(id)) && !allSelected;
  const toggleAll = () => onSelectionChange(allSelected ? [] : selectAllIds);
  const toggleRow = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange([...next]);
  };
  const toggleExpand = (id: string) => {
    const next = new Set(expandedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onExpandedChange([...next]);
  };

  // +1 expander column, +1 select column (selection is always wired here).
  const totalCols = columns.length + 1 + 1;
  const count = data.length;

  const getItemKey = useCallback(
    (index: number) => (data[index] != null ? getRowId(data[index]!) : String(index)),
    [data, getRowId],
  );
  // An expanded row is taller; bias its estimate so first-paint windowing for a
  // pre-expanded set isn't wildly short before measurement lands.
  const estimateHeight = useCallback(
    (index: number) => {
      const row = data[index];
      const isExpanded = row != null && expandedSet.has(getRowId(row));
      return isExpanded ? estimateRowHeight * 3 : estimateRowHeight;
    },
    // expandedSet is rebuilt each render from `expanded`; depend on the source.
    [data, getRowId, expanded, estimateRowHeight],
  );

  const { startIndex, endIndex, topPad, bottomPad, measureRef } = useDynamicVirtualizer({
    count,
    estimateHeight,
    viewportHeight,
    scrollTop,
    overscan,
    getItemKey,
    observeSibling: true,
    // Group height = main <tr> + the detail <tr> when it is shown (not hidden).
    measureNode: (node) => {
      const detail = node.nextElementSibling as HTMLElement | null;
      const detailHeight = detail && !detail.hasAttribute('hidden') ? detail.offsetHeight : 0;
      return node.offsetHeight + detailHeight;
    },
  });

  const windowRows = data.slice(startIndex, endIndex);

  return (
    <div
      className={styles.virtualViewport}
      style={{ height: viewportHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* aria-rowcount counts the header row (1) + all data main-rows, so AT
          reports the true total even though only a window is in the DOM. Detail
          rows are excluded from the rowindex sequence. */}
      <table
        className={styles.expTable}
        data-sticky={stickyHeader ? 'true' : undefined}
        aria-rowcount={count + 1}
      >
        {caption != null ? (
          <caption className={styles.expCaption}>
            {captionVisible ? caption : <span className={styles.srOnly}>{caption}</span>}
          </caption>
        ) : null}
        <thead className={styles.expThead}>
          <tr aria-rowindex={1}>
            <th scope="col" className={styles.expTh} data-control="true" />
            <th scope="col" className={styles.expTh} data-control="true">
              <Checkbox
                aria-label={messages.dataTable.selectAll}
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
                  className={styles.expTh}
                  data-align={col.align ?? 'start'}
                  aria-sort={ariaSort(col)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {isSortable(col) ? (
                    <button
                      type="button"
                      className={styles.expSortButton}
                      onClick={(event) => handleSort(col, event)}
                      data-active={found ? 'true' : undefined}
                    >
                      {col.header}
                      {sort.length > 1 && found ? (
                        <span className={styles.expSortPriority} aria-hidden="true">
                          {found.index + 1}
                        </span>
                      ) : null}
                      <span
                        className={styles.expSortIcon}
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
                  <td key={c} className={styles.expTd}>
                    <span className={styles.expSkeleton} aria-hidden="true" />
                  </td>
                ))}
              </tr>
            ))
          ) : count === 0 ? (
            <tr>
              <td className={styles.expEmptyCell} colSpan={totalCols}>
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
                return (
                  <ExpandedRowGroup
                    key={id}
                    id={id}
                    row={row}
                    rowIndex={absIndex}
                    columns={columns}
                    dataColumns={dataColumns}
                    selectable={true}
                    isSelected={selectedSet.has(id)}
                    isExpanded={expandedSet.has(id)}
                    rowLabel={`row ${id}`}
                    totalCols={totalCols}
                    // +2: the header row is aria-rowindex 1, so data rows are
                    // 1-based + 1. Detail rows are intentionally left out.
                    ariaRowIndex={absIndex + 2}
                    // The ref measures the whole group (main + detail) so expanding
                    // a row grows its cached height and recomputes the spacers.
                    rowRef={measureRef(absIndex)}
                    onToggleSelect={() => toggleRow(id)}
                    onToggleExpand={() => toggleExpand(id)}
                    renderExpanded={renderExpanded}
                  />
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

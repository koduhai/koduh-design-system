import type { MouseEvent, ReactNode } from 'react';
import type { Ref } from 'react';
import type { Column, SortDirection, SortRule } from '../Table';
import { Checkbox } from '../Checkbox';
import { useMessages } from '../../i18n';
import type { DataColumn } from './types';
import styles from './DataTable.module.css';

// ─── Expandable table ─────────────────────────────────────────────────────────
// The shared `Table` renders one <tr> per row and can't host a spanning detail
// row, so the expandable variant owns its own <table> markup. It reuses the
// DataTable/Table token-driven classes and mirrors Table's sort + selection
// wiring (a leading expander column is prepended). `ExpandedRowGroup` is exported
// so the virtualized expandable variant can reuse the exact main+detail row
// markup verbatim.

interface ExpandableTableProps<Row> {
  columns: Column<Row>[];
  dataColumns: DataColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  caption?: ReactNode;
  captionVisible?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  loadingRows: number;
  empty?: ReactNode;
  sort: SortRule[];
  onSortChange: (key: string, dir: SortDirection, event?: MouseEvent) => void;
  selectable: boolean;
  selectedIds: string[];
  selectAllIds: string[];
  onSelectionChange: (ids: string[]) => void;
  expanded: string[];
  onExpandedChange: (ids: string[]) => void;
  renderExpanded: (row: Row) => ReactNode;
}

export function ExpandableTable<Row>({
  columns,
  dataColumns,
  rows,
  getRowId,
  caption,
  captionVisible = false,
  stickyHeader = false,
  loading = false,
  loadingRows,
  empty,
  sort,
  onSortChange,
  selectable,
  selectedIds,
  selectAllIds,
  onSelectionChange,
  expanded,
  onExpandedChange,
  renderExpanded,
}: ExpandableTableProps<Row>) {
  const messages = useMessages();
  const ruleIndex = new Map(sort.map((r, i) => [r.key, i] as const));
  const ruleFor = (key: string) => {
    const i = ruleIndex.get(key);
    return i === undefined ? undefined : { rule: sort[i]!, index: i };
  };

  const selectedSet = new Set(selectedIds);
  const allSelected =
    selectable && selectAllIds.length > 0 && selectAllIds.every((id) => selectedSet.has(id));
  const someSelected = selectable && selectAllIds.some((id) => selectedSet.has(id)) && !allSelected;

  // +1 expander column, +1 select column when selectable.
  const totalCols = columns.length + 1 + (selectable ? 1 : 0);

  const expandedSet = new Set(expanded);

  const ariaSort = (col: Column<Row>): 'ascending' | 'descending' | 'none' | undefined => {
    if (!col.sortable) return undefined;
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

  return (
    <table className={styles.expTable} data-sticky={stickyHeader ? 'true' : undefined}>
      {caption != null ? (
        <caption className={styles.expCaption}>
          {captionVisible ? caption : <span className={styles.srOnly}>{caption}</span>}
        </caption>
      ) : null}
      <thead className={styles.expThead}>
        <tr>
          <th scope="col" className={styles.expTh} data-control="true" />
          {selectable ? (
            <th scope="col" className={styles.expTh} data-control="true">
              <Checkbox
                aria-label={messages.dataTable.selectAll}
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
                className={styles.expTh}
                data-align={col.align ?? 'start'}
                aria-sort={ariaSort(col)}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.sortable ? (
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
        ) : rows.length === 0 ? (
          <tr>
            <td className={styles.expEmptyCell} colSpan={totalCols}>
              {empty}
            </td>
          </tr>
        ) : (
          rows.map((row, rowIndex) => {
            const id = getRowId(row);
            const isSelected = selectedSet.has(id);
            const isExpanded = expandedSet.has(id);
            const label = `row ${id}`;
            return (
              <ExpandedRowGroup
                key={id}
                id={id}
                row={row}
                rowIndex={rowIndex}
                columns={columns}
                dataColumns={dataColumns}
                selectable={selectable}
                isSelected={isSelected}
                isExpanded={isExpanded}
                rowLabel={label}
                totalCols={totalCols}
                onToggleSelect={() => toggleRow(id)}
                onToggleExpand={() => toggleExpand(id)}
                renderExpanded={renderExpanded}
              />
            );
          })
        )}
      </tbody>
    </table>
  );
}

interface ExpandedRowGroupProps<Row> {
  id: string;
  row: Row;
  rowIndex: number;
  columns: Column<Row>[];
  dataColumns: DataColumn<Row>[];
  selectable: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  rowLabel: string;
  totalCols: number;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  renderExpanded: (row: Row) => ReactNode;
  /**
   * Absolute aria-rowindex applied to the main `<tr>` (the virtualized variant
   * passes the real position over the full set; the paginated variant omits it).
   * The detail `<tr>` is intentionally left out of the rowindex sequence.
   */
  ariaRowIndex?: number;
  /**
   * Ref to the main `<tr>` so a caller can measure the group's rendered height
   * (main row + expanded detail). Used by the dynamic-height virtualizer.
   */
  rowRef?: Ref<HTMLTableRowElement>;
}

export function ExpandedRowGroup<Row>({
  id,
  row,
  rowIndex,
  columns,
  dataColumns,
  selectable,
  isSelected,
  isExpanded,
  rowLabel,
  totalCols,
  onToggleSelect,
  onToggleExpand,
  renderExpanded,
  ariaRowIndex,
  rowRef,
}: ExpandedRowGroupProps<Row>) {
  const messages = useMessages();
  const detailId = `ku-dt-detail-${id}`;
  return (
    <>
      <tr
        ref={rowRef}
        className={styles.expTr}
        data-selected={isSelected ? 'true' : undefined}
        aria-rowindex={ariaRowIndex}
      >
        <td className={styles.expTd} data-control="true">
          <button
            type="button"
            className={styles.expandToggle}
            aria-expanded={isExpanded}
            aria-controls={detailId}
            aria-label={
              isExpanded
                ? messages.dataTable.collapseRow(rowLabel)
                : messages.dataTable.expandRow(rowLabel)
            }
            onClick={onToggleExpand}
          >
            <span className={styles.expandIcon} aria-hidden="true" data-expanded={isExpanded} />
          </button>
        </td>
        {selectable ? (
          <td className={styles.expTd} data-control="true">
            <Checkbox
              aria-label={messages.dataTable.selectRow(rowLabel)}
              checked={isSelected}
              onChange={onToggleSelect}
            />
          </td>
        ) : null}
        {columns.map((col, colIndex) => {
          const dataCol = dataColumns[colIndex];
          return (
            <td key={col.key} className={styles.expTd} data-align={col.align ?? 'start'}>
              {dataCol?.render
                ? dataCol.render(row, rowIndex)
                : String((row as Record<string, unknown>)[col.key] ?? '')}
            </td>
          );
        })}
      </tr>
      <tr className={styles.expDetailRow} data-expanded={isExpanded} hidden={!isExpanded}>
        <td id={detailId} className={styles.expDetailCell} colSpan={totalCols}>
          {isExpanded ? renderExpanded(row) : null}
        </td>
      </tr>
    </>
  );
}

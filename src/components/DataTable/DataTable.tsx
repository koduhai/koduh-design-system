import { forwardRef, useEffect, useMemo, useRef } from 'react';
import type { ForwardedRef, KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';
import { Table } from '../Table';
import type { Column, SortDirection } from '../Table';
import { Checkbox } from '../Checkbox';
import { useControllableState } from '../../primitives';
import { useMessages } from '../../i18n';
import { cx } from '../../utils/cx';
import { filterSortRows, paginateRows, cycleSort, pageCount, clampPage } from './pipeline';
import { Pagination } from '../Pagination';
import { Select } from '../Select';
import { TextField } from '../TextField';
import type {
  ColumnWidths,
  DataColumn,
  DataTableProps,
  FilterState,
  FilterValue,
  SortRule,
} from './types';
import { ColumnFilter } from './ColumnFilter';
import styles from './DataTable.module.css';

const DEFAULT_MIN_WIDTH = 48;

function headerLabel<Row>(col: DataColumn<Row>): string {
  return typeof col.header === 'string' ? col.header : col.key;
}

/**
 * Parse a numeric pixel value from a CSS width string (e.g. '180px' → 180) so an
 * unresized column can still seed aria-valuenow. Returns undefined for non-px
 * widths (%, ch, auto) where no meaningful px value can be derived at render time.
 */
function parsePxWidth(width: string | undefined): number | undefined {
  if (width == null) return undefined;
  const match = /^(\d+(?:\.\d+)?)px$/.exec(width.trim());
  return match ? Number(match[1]) : undefined;
}

function DataTableInner<Row>(
  {
    columns,
    data,
    getRowId,
    sort,
    defaultSort = [],
    onSortChange,
    page,
    defaultPage = 1,
    onPageChange,
    pageSize,
    defaultPageSize,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50],
    selectedIds,
    defaultSelectedIds = [],
    onSelectionChange,
    search,
    defaultSearch = '',
    onSearchChange,
    searchable = true,
    filters,
    defaultFilters = {},
    onFiltersChange,
    caption,
    captionVisible,
    stickyHeader,
    loading,
    loadingRows,
    empty,
    noResults,
    renderExpanded,
    expandedIds,
    defaultExpandedIds = [],
    onExpandedChange,
    resizableColumns = false,
    columnWidths,
    defaultColumnWidths = {},
    onColumnWidthsChange,
    resizeStep = 16,
    onStateChange,
    manual = false,
    rowCount,
    className,
    ...props
  }: DataTableProps<Row>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const messages = useMessages();
  const [sortState, setSort] = useControllableState<SortRule[]>({
    value: sort,
    defaultValue: defaultSort,
    onChange: onSortChange,
  });
  const [pageState, setPage] = useControllableState<number>({
    value: page,
    defaultValue: defaultPage,
    onChange: onPageChange,
  });
  const [pageSizeState, setPageSize] = useControllableState<number>({
    value: pageSize,
    defaultValue: defaultPageSize ?? pageSizeOptions[0] ?? 10,
    onChange: onPageSizeChange,
  });
  const [selected, setSelected] = useControllableState<string[]>({
    value: selectedIds,
    defaultValue: defaultSelectedIds,
    onChange: onSelectionChange,
  });
  const [searchState, setSearch] = useControllableState<string>({
    value: search,
    defaultValue: defaultSearch,
    onChange: onSearchChange,
  });
  const [filterState, setFilters] = useControllableState<FilterState>({
    value: filters,
    defaultValue: defaultFilters,
    onChange: onFiltersChange,
  });
  const [expanded, setExpanded] = useControllableState<string[]>({
    value: expandedIds,
    defaultValue: defaultExpandedIds,
    onChange: onExpandedChange,
  });
  const [widths, setWidths] = useControllableState<ColumnWidths>({
    value: columnWidths,
    defaultValue: defaultColumnWidths,
    onChange: onColumnWidthsChange,
  });

  // Split into two memos so a page change re-slices a cached sorted array instead
  // of re-running the O(n log n) filter→search→sort over every row. The first
  // memo (the expensive pass) is keyed only on data/columns/filters/search/sort;
  // the second (a cheap slice) adds page/pageSize.
  const { sorted, matchingIds, total } = useMemo(() => {
    if (manual) {
      // Manual (server-side) mode: `data` is the already-processed page; the
      // caller supplies the unpaged total via `rowCount`.
      return {
        sorted: data,
        matchingIds: data.map(getRowId),
        total: rowCount ?? data.length,
      };
    }
    return filterSortRows({
      data,
      columns,
      getRowId,
      filters: filterState,
      search: searchState,
      sort: sortState,
    });
  }, [manual, rowCount, data, columns, getRowId, filterState, searchState, sortState]);

  const { rows, page: safePage } = useMemo(() => {
    if (manual) {
      // Don't re-slice already-paged server data; just clamp the page number for
      // the range readout / pagination control.
      return { rows: data, page: clampPage(pageState, total, pageSizeState) };
    }
    return paginateRows(sorted, pageState, pageSizeState);
  }, [manual, data, sorted, pageState, pageSizeState, total]);

  // Fix 4: when filtering/searching shrinks the result set below the current
  // page, the view renders the clamped `safePage`, but `pageState` (and any
  // controlled parent via onPageChange) still holds the stale higher page.
  // Reconcile them so internal state and the controlled parent converge.
  useEffect(() => {
    if (safePage !== pageState) {
      setPage(safePage);
    }
  }, [safePage, pageState, setPage]);

  // Surface the current state for server-side consumers. Fires whenever any
  // input the caller would re-fetch on settles. `safePage` (not the raw
  // `pageState`) is reported so the caller fetches the page actually shown.
  // The callback is read through a ref so a consumer passing an inline arrow
  // (`onStateChange={(s) => fetchPage(s)}`) does not re-run this effect (and
  // re-trigger a remote fetch) on every render; only real state changes fire it.
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;
  useEffect(() => {
    onStateChangeRef.current?.({
      sort: sortState,
      filters: filterState,
      search: searchState,
      page: safePage,
      pageSize: pageSizeState,
    });
  }, [sortState, filterState, searchState, safePage, pageSizeState]);

  const handleSortChange = (key: string, _dir: SortRule['dir'], event?: MouseEvent) => {
    setSort(cycleSort(sortState, key, event?.shiftKey ?? false));
  };

  const totalPages = pageCount(total, pageSizeState);
  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSizeState + 1;
  const rangeEnd = manual
    ? Math.min((safePage - 1) * pageSizeState + rows.length, total)
    : Math.min(safePage * pageSizeState, total);

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1); // reset to first page so the user isn't stranded past the new last page
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const filterColumns = columns.filter((c) => c.filter);

  const handleFilterChange = (key: string, next: FilterValue) => {
    setFilters({ ...filterState, [key]: next });
    setPage(1);
  };

  // ─── Column resize ──────────────────────────────────────────────────────────
  const minWidthFor = (col: DataColumn<Row>) => col.minWidth ?? DEFAULT_MIN_WIDTH;
  const isResizable = (col: DataColumn<Row>) => resizableColumns && col.resizable !== false;

  const setColumnWidth = (col: DataColumn<Row>, next: number) => {
    const clamped = Math.max(minWidthFor(col), Math.round(next));
    setWidths({ ...widths, [col.key]: clamped });
  };

  // Live drag tracking. Refs avoid re-subscribing listeners every render and let
  // the pointer handlers read the latest widths (the controllable setter takes a
  // value, not an updater).
  const dragRef = useRef<{ key: string; startX: number; startWidth: number; min: number } | null>(
    null,
  );
  const widthsRef = useRef<ColumnWidths>(widths);
  widthsRef.current = widths;

  useEffect(() => {
    if (!resizableColumns) return;
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      // Pointer delta is reading-direction aware: in RTL, moving the handle left
      // grows the column, so invert by document direction.
      const rtl = typeof document !== 'undefined' && document.dir === 'rtl';
      const delta = (e.clientX - drag.startX) * (rtl ? -1 : 1);
      const next = Math.max(drag.min, Math.round(drag.startWidth + delta));
      setWidths({ ...widthsRef.current, [drag.key]: next });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [resizableColumns, setWidths]);

  const handleResizeKeyDown = (col: DataColumn<Row>, e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const current = widths[col.key];
    const headerEl = (e.currentTarget.closest('th') as HTMLElement | null) ?? null;
    const base = current ?? headerEl?.getBoundingClientRect().width ?? minWidthFor(col);
    e.preventDefault();
    // Reading-direction aware, matching the pointer handler: in RTL the handle
    // visually grows toward the left, so ArrowLeft should grow and ArrowRight
    // shrink (the inverse of LTR).
    const rtl = typeof document !== 'undefined' && document.dir === 'rtl';
    const growKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const sign = e.key === growKey ? 1 : -1;
    setColumnWidth(col, base + sign * resizeStep);
  };

  const handleResizePointerDown = (
    col: DataColumn<Row>,
    e: { clientX: number; currentTarget: HTMLElement },
  ) => {
    const headerEl = e.currentTarget.closest('th') as HTMLElement | null;
    const startWidth =
      widths[col.key] ?? headerEl?.getBoundingClientRect().width ?? minWidthFor(col);
    dragRef.current = {
      key: col.key,
      startX: e.clientX,
      startWidth,
      min: minWidthFor(col),
    };
  };

  // Build the columns handed to the underlying Table. We wrap the header to add a
  // resize handle and apply the persisted width as the column `width`. The base
  // `Column` type only carries a CSS-string `width`, so widths convert to `px`.
  const tableColumns = useMemo<Column<Row>[]>(() => {
    return columns.map((col) => {
      const w = widths[col.key];
      const widthValue = w != null ? `${w}px` : col.width;
      if (!isResizable(col)) {
        return { ...col, width: widthValue } as Column<Row>;
      }
      const label = headerLabel(col);
      const min = minWidthFor(col);
      // Seed aria-valuenow even before the first resize: prefer the persisted
      // width, then a px width from the column config, then the column min, so a
      // focusable range widget always exposes a current value and a lower bound.
      const valueNow = w ?? parsePxWidth(col.width) ?? min;
      const header: ReactNode = (
        <span className={styles.resizableHeader}>
          <span className={styles.resizableHeaderContent}>{col.header}</span>
          <span
            role="separator"
            aria-orientation="vertical"
            aria-label={`Resize ${label} column`}
            aria-valuenow={valueNow}
            aria-valuemin={min}
            tabIndex={0}
            className={styles.resizeHandle}
            onKeyDown={(ev) => handleResizeKeyDown(col, ev)}
            onPointerDown={(ev) => {
              ev.preventDefault();
              handleResizePointerDown(col, ev);
            }}
            // Don't let a drag/keypress on the handle trigger header sort.
            onClick={(ev) => ev.stopPropagation()}
          />
        </span>
      );
      return { ...col, header, width: widthValue } as Column<Row>;
    });
    // header handlers close over stable refs/state setters; recompute on
    // width/col/flag and on resizeStep so the keyboard handler's step stays current.
  }, [columns, widths, resizableColumns, resizeStep]);

  // Resolve the empty slot Table renders when there are zero rows. When `total`
  // is 0 but `data` has rows, the dataset was filtered/searched to nothing —
  // distinct from a genuinely empty dataset. `noResults` wins for that filter
  // miss; a function `empty` receives the same distinction as context.
  // Prop precedence is unchanged: a `noResults` prop wins for the filter-miss
  // case, otherwise the (value or function) `empty` prop is used. Only when the
  // consumer supplied neither do we fall back to the i18n catalog defaults
  // (English copy matches the prior built-in defaults): `noResults` for the
  // filter-miss case, `empty` for a genuinely empty dataset.
  const hasData = manual ? total > 0 : data.length > 0;
  const isFiltered = !manual && data.length > 0 && total === 0;
  const providedEmptyContent =
    isFiltered && noResults != null
      ? noResults
      : typeof empty === 'function'
        ? empty({ hasData, isFiltered })
        : empty;
  const catalogFallback =
    isFiltered && noResults == null && empty == null
      ? messages.dataTable.noResults
      : messages.dataTable.empty;
  const emptyContent = providedEmptyContent ?? catalogFallback;

  const toolbar =
    searchable || selected.length > 0 ? (
      <div className={styles.toolbar}>
        {searchable ? (
          <TextField
            type="search"
            className={styles.search}
            label="Search"
            placeholder="Search…"
            value={searchState}
            onChange={handleSearchChange}
          />
        ) : null}
        {selected.length > 0 ? (
          <div className={styles.selection}>
            <span>{selected.length} selected</span>
            <button
              type="button"
              className={styles.clearSelection}
              aria-label="Clear selection"
              onClick={() => setSelected([])}
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>
    ) : null;

  const filtersBar =
    filterColumns.length > 0 ? (
      <div className={styles.filters}>
        {filterColumns.map((col) => (
          <ColumnFilter
            key={col.key}
            column={col}
            data={data}
            value={filterState[col.key]}
            onChange={(next) => handleFilterChange(col.key, next)}
          />
        ))}
      </div>
    ) : null;

  const footer = (
    <div className={styles.footer}>
      <Select
        className={styles.pageSize}
        label="Rows per page"
        size="sm"
        value={String(pageSizeState)}
        onChange={handlePageSizeChange}
        options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
      />
      <span className={styles.range} aria-live="polite">
        {rangeStart}–{rangeEnd} of {total}
      </span>
      <Pagination count={totalPages} page={safePage} onPageChange={setPage} />
    </div>
  );

  const tableEl = renderExpanded ? (
    <ExpandableTable
      columns={tableColumns}
      dataColumns={columns}
      rows={rows}
      getRowId={getRowId}
      caption={caption}
      captionVisible={captionVisible}
      stickyHeader={stickyHeader}
      loading={loading}
      loadingRows={loadingRows ?? pageSizeState}
      empty={emptyContent}
      sort={sortState}
      onSortChange={handleSortChange}
      selectable={true}
      selectedIds={selected}
      selectAllIds={matchingIds}
      onSelectionChange={setSelected}
      expanded={expanded}
      onExpandedChange={setExpanded}
      renderExpanded={renderExpanded}
    />
  ) : (
    <Table
      columns={tableColumns}
      data={rows}
      getRowId={getRowId}
      caption={caption}
      captionVisible={captionVisible}
      stickyHeader={stickyHeader}
      loading={loading}
      loadingRows={loadingRows ?? pageSizeState}
      empty={emptyContent}
      sort={sortState}
      onSortChange={handleSortChange}
      selectedIds={selected}
      selectAllIds={matchingIds}
      onSelectionChange={setSelected}
    />
  );

  return (
    <div ref={ref} className={cx(styles.root, className)} {...props}>
      {toolbar}
      {filtersBar}
      {/* Horizontal-scroll container: wide tables (many columns on a narrow
          viewport) scroll internally instead of overflowing the page. Note this
          establishes a scroll container, so a sticky header needs the wrapper
          height bounded (e.g. max-height) to stick within it. */}
      <div className={styles.tableWrap}>{tableEl}</div>
      {footer}
    </div>
  );
}

// ─── Expandable table ─────────────────────────────────────────────────────────
// The shared `Table` renders one <tr> per row and can't host a spanning detail
// row, so the expandable variant owns its own <table> markup. It reuses the
// DataTable/Table token-driven classes and mirrors Table's sort + selection
// wiring (a leading expander column is prepended).

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

function ExpandableTable<Row>({
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
}

function ExpandedRowGroup<Row>({
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
}: ExpandedRowGroupProps<Row>) {
  const detailId = `ku-dt-detail-${id}`;
  return (
    <>
      <tr className={styles.expTr} data-selected={isSelected ? 'true' : undefined}>
        <td className={styles.expTd} data-control="true">
          <button
            type="button"
            className={styles.expandToggle}
            aria-expanded={isExpanded}
            aria-controls={detailId}
            aria-label={isExpanded ? `Collapse ${rowLabel}` : `Expand ${rowLabel}`}
            onClick={onToggleExpand}
          >
            <span className={styles.expandIcon} aria-hidden="true" data-expanded={isExpanded} />
          </button>
        </td>
        {selectable ? (
          <td className={styles.expTd} data-control="true">
            <Checkbox
              aria-label={`Select ${rowLabel}`}
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

export const DataTable = /* @__PURE__ */ forwardRef(DataTableInner) as <Row>(
  props: DataTableProps<Row> & { ref?: Ref<HTMLDivElement> },
) => ReturnType<typeof DataTableInner>;

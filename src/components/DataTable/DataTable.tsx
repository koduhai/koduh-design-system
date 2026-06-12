import { forwardRef, useEffect, useMemo, useRef } from 'react';
import type { ForwardedRef, KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';
import { Table } from '../Table';
import type { Column } from '../Table';
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
import { VirtualizedTable } from './VirtualizedTable';
import { ExpandableTable } from './ExpandableTable';
import { VirtualizedExpandableTable } from './VirtualizedExpandableTable';
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
    virtualized = false,
    rowHeight = 44,
    estimateRowHeight,
    viewportHeight = 400,
    overscan = 6,
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
            aria-label={messages.dataTable.resizeColumn(label)}
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
            label={messages.dataTable.searchLabel}
            placeholder={messages.dataTable.search}
            value={searchState}
            onChange={handleSearchChange}
          />
        ) : null}
        {selected.length > 0 ? (
          <div className={styles.selection}>
            <span>{messages.dataTable.selectedCount(selected.length)}</span>
            <button
              type="button"
              className={styles.clearSelection}
              aria-label={messages.clearSelection}
              onClick={() => setSelected([])}
            >
              {messages.dataTable.clear}
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

  // Virtualization is a client-side alternative to pagination, so it can't combine
  // with `manual` (server-paged) mode — there it is ignored. It *does* combine with
  // `renderExpanded`: with both on, the dynamic-height (measured) windowing variant
  // hosts the variable-height detail rows. Without `renderExpanded`, the cheaper
  // fixed-height windowing variant renders.
  const useVirtual = virtualized && !manual;
  const useVirtualExpandable = useVirtual && Boolean(renderExpanded);

  const footer = useVirtual ? (
    <div className={styles.footer}>
      <span className={styles.range} aria-live="polite">
        {messages.dataTable.rowCount(total)}
      </span>
    </div>
  ) : (
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

  const tableEl = useVirtualExpandable ? (
    <VirtualizedExpandableTable
      columns={tableColumns}
      dataColumns={columns}
      getRowId={getRowId}
      // The full sorted/filtered result (not the page slice) is windowed here.
      data={sorted}
      caption={caption}
      captionVisible={captionVisible}
      stickyHeader={stickyHeader}
      loading={loading}
      loadingRows={loadingRows ?? Math.ceil(viewportHeight / rowHeight)}
      empty={emptyContent}
      sort={sortState}
      onSortChange={handleSortChange}
      selectedIds={selected}
      selectAllIds={matchingIds}
      onSelectionChange={setSelected}
      expanded={expanded}
      onExpandedChange={setExpanded}
      renderExpanded={renderExpanded!}
      // With measured heights, the exact rowHeight isn't required — it (or an
      // explicit estimateRowHeight) just seeds the pre-measurement estimate.
      estimateRowHeight={estimateRowHeight ?? rowHeight}
      viewportHeight={viewportHeight}
      overscan={overscan}
    />
  ) : useVirtual ? (
    <VirtualizedTable
      columns={tableColumns}
      getRowId={getRowId}
      // The full sorted/filtered result (not the page slice) is windowed here.
      data={sorted}
      caption={caption}
      captionVisible={captionVisible}
      stickyHeader={stickyHeader}
      loading={loading}
      loadingRows={loadingRows ?? Math.ceil(viewportHeight / rowHeight)}
      empty={emptyContent}
      sort={sortState}
      onSortChange={handleSortChange}
      selectedIds={selected}
      selectAllIds={matchingIds}
      onSelectionChange={setSelected}
      rowHeight={rowHeight}
      viewportHeight={viewportHeight}
      overscan={overscan}
    />
  ) : renderExpanded ? (
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
          height bounded (e.g. max-height) to stick within it. The virtualized
          path owns its own (vertical + horizontal) scroll viewport, so the extra
          wrapper is skipped there. */}
      {useVirtual ? tableEl : <div className={styles.tableWrap}>{tableEl}</div>}
      {footer}
    </div>
  );
}

export const DataTable = /* @__PURE__ */ forwardRef(DataTableInner) as <Row>(
  props: DataTableProps<Row> & { ref?: Ref<HTMLDivElement> },
) => ReturnType<typeof DataTableInner>;

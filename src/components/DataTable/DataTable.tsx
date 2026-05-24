import { forwardRef, useEffect, useMemo } from 'react';
import type { ForwardedRef, MouseEvent, Ref } from 'react';
import { Table } from '../Table';
import type { Column } from '../Table';
import { useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { filterSortRows, paginateRows, cycleSort, pageCount } from './pipeline';
import { Pagination } from '../Pagination';
import { Select } from '../Select';
import { TextField } from '../TextField';
import type { DataTableProps, FilterState, FilterValue, SortRule } from './types';
import { ColumnFilter } from './ColumnFilter';
import styles from './DataTable.module.css';

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
    className,
    ...props
  }: DataTableProps<Row>,
  ref: ForwardedRef<HTMLDivElement>,
) {
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

  // Split into two memos so a page change re-slices a cached sorted array instead
  // of re-running the O(n log n) filter→search→sort over every row. The first
  // memo (the expensive pass) is keyed only on data/columns/filters/search/sort;
  // the second (a cheap slice) adds page/pageSize.
  const { sorted, matchingIds, total } = useMemo(
    () =>
      filterSortRows({
        data,
        columns,
        getRowId,
        filters: filterState,
        search: searchState,
        sort: sortState,
      }),
    [data, columns, getRowId, filterState, searchState, sortState],
  );
  const { rows, page: safePage } = useMemo(
    () => paginateRows(sorted, pageState, pageSizeState),
    [sorted, pageState, pageSizeState],
  );

  // Fix 4: when filtering/searching shrinks the result set below the current
  // page, the view renders the clamped `safePage`, but `pageState` (and any
  // controlled parent via onPageChange) still holds the stale higher page.
  // Reconcile them so internal state and the controlled parent converge.
  // Guarded on inequality to avoid an update loop, and setPage is a no-op write
  // for controlled mode beyond firing onPageChange — exactly what we want.
  useEffect(() => {
    if (safePage !== pageState) {
      setPage(safePage);
    }
  }, [safePage, pageState, setPage]);

  const handleSortChange = (key: string, _dir: SortRule['dir'], event?: MouseEvent) => {
    setSort(cycleSort(sortState, key, event?.shiftKey ?? false));
  };

  const totalPages = pageCount(total, pageSizeState);
  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSizeState + 1;
  const rangeEnd = Math.min(safePage * pageSizeState, total);

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

  // DataColumn carries extra fields; Table only needs the base Column shape.
  const tableColumns = columns as Column<Row>[];

  // Resolve the empty slot Table renders when there are zero rows. When `total`
  // is 0 but `data` has rows, the dataset was filtered/searched to nothing —
  // distinct from a genuinely empty dataset. `noResults` wins for that filter
  // miss; a function `empty` receives the same distinction as context.
  const hasData = data.length > 0;
  const isFiltered = hasData && total === 0;
  const emptyContent =
    isFiltered && noResults != null
      ? noResults
      : typeof empty === 'function'
        ? empty({ hasData, isFiltered })
        : empty;

  return (
    <div ref={ref} className={cx(styles.root, className)} {...props}>
      {searchable || selected.length > 0 ? (
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
      ) : null}
      {filterColumns.length > 0 ? (
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
      ) : null}
      {/* Horizontal-scroll container: wide tables (many columns on a narrow
          viewport) scroll internally instead of overflowing the page. Note this
          establishes a scroll container, so a sticky header needs the wrapper
          height bounded (e.g. max-height) to stick within it. */}
      <div className={styles.tableWrap}>
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
      </div>
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
    </div>
  );
}

export const DataTable = /* @__PURE__ */ forwardRef(DataTableInner) as <Row>(
  props: DataTableProps<Row> & { ref?: Ref<HTMLDivElement> },
) => ReturnType<typeof DataTableInner>;

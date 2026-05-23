import { forwardRef } from 'react';
import type { ForwardedRef, MouseEvent, Ref } from 'react';
import { Table } from '../Table';
import type { Column } from '../Table';
import { useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { runPipeline, cycleSort, pageCount } from './pipeline';
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

  const {
    rows,
    matchingIds,
    total,
    page: safePage,
  } = runPipeline({
    data,
    columns,
    getRowId,
    filters: filterState,
    search: searchState,
    sort: sortState,
    page: pageState,
    pageSize: pageSizeState,
  });

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

  // Selection wired in Task 11.
  void setSelected;

  const filterColumns = columns.filter((c) => c.filter);

  const handleFilterChange = (key: string, next: FilterValue) => {
    setFilters({ ...filterState, [key]: next });
    setPage(1);
  };

  // DataColumn carries extra fields; Table only needs the base Column shape.
  const tableColumns = columns as Column<Row>[];

  return (
    <div ref={ref} className={cx(styles.root, className)} {...props}>
      {searchable ? (
        <div className={styles.toolbar}>
          <TextField
            type="search"
            className={styles.search}
            label="Search"
            placeholder="Search…"
            value={searchState}
            onChange={handleSearchChange}
          />
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
      <Table
        columns={tableColumns}
        data={rows}
        getRowId={getRowId}
        caption={caption}
        captionVisible={captionVisible}
        stickyHeader={stickyHeader}
        loading={loading}
        loadingRows={loadingRows}
        empty={empty}
        sort={sortState}
        onSortChange={handleSortChange}
        selectedIds={selected}
        selectAllIds={matchingIds}
      />
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

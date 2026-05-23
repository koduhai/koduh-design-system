import { forwardRef } from 'react';
import type { ForwardedRef, Ref } from 'react';
import { Table } from '../Table';
import type { Column } from '../Table';
import { useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { runPipeline } from './pipeline';
import type { DataTableProps, FilterState, SortRule } from './types';
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

  // Setters/values consumed by later tasks (sort interaction, pagination, search,
  // filters, selection). Referenced here so strict unused checks pass until wired.
  void setSort;
  void setPage;
  void setPageSize;
  void setSelected;
  void setSearch;
  void setFilters;
  void total;
  void safePage;
  void searchable;
  void pageSizeOptions;

  // DataColumn carries extra fields; Table only needs the base Column shape.
  const tableColumns = columns as Column<Row>[];

  return (
    <div ref={ref} className={cx(styles.root, className)} {...props}>
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
        selectedIds={selected}
        selectAllIds={matchingIds}
      />
    </div>
  );
}

export const DataTable = /* @__PURE__ */ forwardRef(DataTableInner) as <Row>(
  props: DataTableProps<Row> & { ref?: Ref<HTMLDivElement> },
) => ReturnType<typeof DataTableInner>;

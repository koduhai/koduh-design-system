import type { HTMLAttributes, ReactNode } from 'react';
import type { Column, SortRule, SortDirection } from '../Table';

export type { SortRule, SortDirection };

export type ColumnType = 'text' | 'number' | 'date';
export type FilterKind = 'text' | 'select' | 'number-range' | 'date-range';

/** Per-filter value shapes, discriminated by their keys at runtime. */
export type FilterValue =
  | string // text
  | string[] // select (multi)
  | { min?: number; max?: number } // number-range
  | { from?: string; to?: string }; // date-range (ISO yyyy-mm-dd)

export type FilterState = Record<string, FilterValue>;

/** Context passed to a function `empty` slot so copy can match the empty case. */
export interface EmptyStateContext {
  /** True when `data` contains rows — so an empty result is a filter/search miss. */
  hasData: boolean;
  /** True when a non-empty dataset was filtered/searched down to zero rows. */
  isFiltered: boolean;
}

export interface DataColumn<Row> extends Column<Row> {
  /** Drives the default comparator and the filter control. Default 'text'. */
  type?: ColumnType;
  /** Value used for sort/filter/search. Defaults to `row[key]`. */
  getValue?: (row: Row) => string | number | Date;
  /** Optional comparator override; otherwise a type-aware default is used. */
  compare?: (a: Row, b: Row) => number;
  /** Opt-in per-column filter control. Omit for a non-filterable column. */
  filter?: FilterKind;
  /** Options for a `select` filter. Auto-derived from data when omitted. */
  filterOptions?: { label: string; value: string }[];
  /** Include this column in global search. Defaults to `type === 'text'`. */
  searchable?: boolean;
}

export interface DataTableProps<Row> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Column definitions. The filter/search/sort pipeline is memoized on `columns`
   * identity, so for large datasets pass a stable (hoisted or `useMemo`-d) array
   * — an inline `columns={[...]}` literal re-runs the whole pass every render.
   */
  columns: DataColumn<Row>[];
  data: Row[];
  getRowId: (row: Row) => string;

  sort?: SortRule[];
  defaultSort?: SortRule[];
  onSortChange?: (sort: SortRule[]) => void;

  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /**
   * Rows per page. Pagination is the scaling strategy — only the current page is
   * rendered, so a 600-row dataset stays cheap. There is no row virtualization;
   * a single-scroll table of every row means setting `pageSize` to the full
   * count, which renders every row. Prefer a bounded `pageSize` for large data.
   */
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];

  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  search?: string;
  defaultSearch?: string;
  onSearchChange?: (query: string) => void;
  searchable?: boolean;

  filters?: FilterState;
  defaultFilters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;

  caption?: ReactNode;
  captionVisible?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  /**
   * Number of skeleton rows shown while `loading`. Defaults to the effective
   * `pageSize` so the loading height matches the loaded page (no layout jump).
   */
  loadingRows?: number;
  /**
   * Shown when there are no rows to display. Pass a render function to tailor the
   * message to the case: `hasData` is false for a genuinely empty dataset, and
   * true (with `isFiltered`) when filters/search removed every row.
   */
  empty?: ReactNode | ((ctx: EmptyStateContext) => ReactNode);
  /**
   * Convenience slot shown specifically when a non-empty dataset is filtered or
   * searched down to zero rows (e.g. "No matches — clear your filters"). Takes
   * precedence over `empty` in that case; the truly-empty-dataset case still
   * falls back to `empty`.
   */
  noResults?: ReactNode;
}

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
  columns: DataColumn<Row>[];
  data: Row[];
  getRowId: (row: Row) => string;

  sort?: SortRule[];
  defaultSort?: SortRule[];
  onSortChange?: (sort: SortRule[]) => void;

  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
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
  loadingRows?: number;
  empty?: ReactNode;
}

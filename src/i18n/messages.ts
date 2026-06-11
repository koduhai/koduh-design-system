/**
 * The catalog of every built-in UI string the library renders, in one typed
 * place so a consumer can translate them all through {@link KoduhI18nProvider}.
 * Parameterized strings are functions. English defaults live in
 * {@link defaultMessages}; per-component props still override these.
 */
export interface Messages {
  /** Generic close control (Dialog, Drawer, Snackbar). */
  close: string;
  /** Dismiss control (Alert). */
  dismiss: string;
  /** Clear/reset a selection (clearable Select, Combobox). */
  clearSelection: string;
  pagination: {
    /** aria-label for the nav landmark. */
    label: string;
    previous: string;
    next: string;
    /** aria-label for a page button. */
    page: (page: number) => string;
    /** aria-label for the current page. */
    current: (page: number) => string;
  };
  carousel: {
    /** aria-label for the slide list. */
    label: string;
    /** aria-roledescription / region name. */
    region: string;
    previous: string;
    next: string;
    goToSlide: (slide: number) => string;
    /** Live-region status, e.g. "Slide 2 of 5". */
    slideStatus: (index: number, total: number) => string;
  };
  combobox: {
    noResults: string;
    /** Live result count announced while filtering. */
    resultCount: (count: number) => string;
  };
  avatarGroup: {
    /** Overflow indicator, e.g. "3 more". */
    overflow: (count: number) => string;
  };
  dataTable: {
    empty: string;
    loading: string;
    noResults: string;
  };
}

/** A consumer override: any subset of the catalog (one level deep). */
export type PartialMessages = {
  [K in keyof Messages]?: Messages[K] extends (...args: never[]) => unknown
    ? Messages[K]
    : Messages[K] extends object
      ? Partial<Messages[K]>
      : Messages[K];
};

/** English defaults. These match the components' prior hardcoded strings exactly. */
export const defaultMessages: Messages = {
  close: 'Close',
  dismiss: 'Dismiss',
  clearSelection: 'Clear selection',
  pagination: {
    label: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    // Both default to "Go to page N" to match the prior behavior; the current page
    // is conveyed by aria-current, so its label is not suffixed (that would
    // double-announce). `current` exists so a consumer CAN distinguish it.
    page: (page) => `Go to page ${page}`,
    current: (page) => `Go to page ${page}`,
  },
  carousel: {
    label: 'Slides',
    region: 'carousel',
    previous: 'Previous slide',
    next: 'Next slide',
    goToSlide: (slide) => `Go to slide ${slide}`,
    slideStatus: (index, total) => `Slide ${index} of ${total}`,
  },
  combobox: {
    noResults: 'No results',
    resultCount: (count) =>
      count === 0 ? 'No results' : `${count} result${count === 1 ? '' : 's'} available`,
  },
  avatarGroup: {
    overflow: (count) => `${count} more`,
  },
  dataTable: {
    empty: 'No data',
    loading: 'Loading',
    noResults: 'No matching results',
  },
};

/**
 * Deep-merge consumer overrides over the defaults. The catalog is one level of
 * namespaces deep whose leaves are strings or functions, so a namespace is
 * shallow-merged (per-key override wins) and a top-level leaf is replaced. The
 * `as` casts bridge the per-key union to the indexed assignment; the structure
 * guarantees they are sound.
 */
export function mergeMessages(base: Messages, overrides: PartialMessages): Messages {
  const result: Messages = { ...base };
  for (const key of Object.keys(overrides) as (keyof Messages)[]) {
    const override = overrides[key];
    if (override == null) continue;
    const baseValue = base[key];
    if (
      typeof baseValue === 'object' &&
      typeof override === 'object' &&
      typeof override !== 'function'
    ) {
      (result[key] as object) = { ...baseValue, ...override };
    } else {
      (result[key] as unknown) = override;
    }
  }
  return result;
}

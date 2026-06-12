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
    /** aria-label for an individual slide, e.g. "2 of 5". */
    slide: (index: number, total: number) => string;
    /** aria-roledescription for an individual slide. */
    slideRoleDescription: string;
  };
  combobox: {
    noResults: string;
    /** Live result count announced while filtering. */
    resultCount: (count: number) => string;
    /** Shown while async options are loading. */
    loading: string;
    /** The "create option" entry, e.g. `Add "foo"`. */
    create: (query: string) => string;
    /** aria-label for a removable selected chip in multi-select. */
    removeOption: (label: string) => string;
  };
  avatarGroup: {
    /** Overflow indicator, e.g. "3 more". */
    overflow: (count: number) => string;
  };
  dataTable: {
    empty: string;
    loading: string;
    noResults: string;
    /** Placeholder for the built-in search/filter input. */
    search: string;
    /** Visible label for the built-in search/filter input. */
    searchLabel: string;
    /** Selected-rows count, e.g. "2 selected" (toolbar text + filter badge). */
    selectedCount: (count: number) => string;
    /** Text for the clear-selection button. */
    clear: string;
    /** aria-label for the select-all-rows checkbox. */
    selectAll: string;
    /** aria-label for a row's select checkbox. */
    selectRow: (label: string) => string;
    /** aria-label for a row's expand toggle. */
    expandRow: (label: string) => string;
    /** aria-label for a row's collapse toggle. */
    collapseRow: (label: string) => string;
    /** aria-label for a column resize handle. */
    resizeColumn: (label: string) => string;
  };
  fileUpload: {
    /** Drop-zone instruction when multiple files are allowed. */
    multipleFiles: string;
    /** Drop-zone instruction when a single file is allowed. */
    singleFile: string;
    /** Accepted-types hint appended to the instructions, e.g. "Accepted: .png,.jpg." */
    accepted: (accept: string) => string;
  };
  passwordInput: {
    /** Toggle aria-label when the value is hidden. */
    show: string;
    /** Toggle aria-label when the value is visible. */
    hide: string;
  };
  colorPicker: {
    /** aria-label for the 2D saturation/brightness area. */
    saturationBrightness: string;
    /** aria-valuetext for the saturation/brightness area. */
    svValueText: (saturation: number, brightness: number, hex: string) => string;
    /** aria-label for the hue slider. */
    hue: string;
    /** aria-valuetext for the hue slider, e.g. "120 degrees". */
    hueValueText: (degrees: number) => string;
    /** aria-label for the alpha slider. */
    alpha: string;
    /** Visible label + aria-label for the hex input. */
    hex: string;
    /** Visually-hidden current-color readout, e.g. "Selected color #ff0000". */
    selectedColor: (hex: string) => string;
    /** aria-label for the preset-swatch group. */
    presets: string;
  };
  pinInput: {
    /** aria-label suffix for an individual cell, e.g. "digit 2 of 6". */
    digit: (index: number, length: number) => string;
  };
  rating: {
    /** aria-label for a star option, e.g. "3 stars". */
    starLabel: (rating: number) => string;
  };
  stepper: {
    /** Visually-hidden suffix marking a completed step. */
    completed: string;
  };
  calendar: {
    previousMonth: string;
    nextMonth: string;
  };
  breadcrumbs: {
    /** aria-label for the breadcrumb nav landmark. */
    label: string;
    /** Visually-hidden count of collapsed items, e.g. "2 more breadcrumbs". */
    more: (count: number) => string;
  };
  chip: {
    /** aria-label for a removable chip's delete button. */
    remove: (label: string) => string;
    /** Fallback delete aria-label when the chip label is not a string. */
    removeGeneric: string;
  };
  sidebar: {
    /** Default aria-label for the sidebar nav landmark. */
    label: string;
    /** Collapse-toggle aria-label when collapsed. */
    expand: string;
    /** Collapse-toggle aria-label when expanded. */
    collapse: string;
  };
  commandPalette: {
    placeholder: string;
    noResults: string;
    /** Accessible label for the search input. */
    label: string;
  };
  datePicker: {
    placeholder: string;
    /** Accessible label for the calendar trigger button. */
    triggerLabel: string;
    /** Accessible label for the calendar popover dialog. */
    dialogLabel: string;
  };
  dateRangePicker: {
    /** Placeholder + aria-label for the start-date field. */
    startPlaceholder: string;
    /** Placeholder + aria-label for the end-date field. */
    endPlaceholder: string;
    /** Accessible label for the range popover dialog. */
    dialogLabel: string;
  };
  timePicker: {
    /** aria-label for the hour segment. */
    hour: string;
    /** aria-label for the minute segment. */
    minute: string;
    /** aria-label for the seconds segment. */
    second: string;
    /** aria-label for the AM/PM segment. */
    dayPeriod: string;
    /** aria-valuetext for an unset segment. */
    empty: string;
  };
  numberField: {
    decrement: string;
    increment: string;
  };
  table: {
    /** aria-label for the select-all-rows checkbox. */
    selectAll: string;
    /** aria-label for a row's select checkbox. */
    selectRow: (id: string) => string;
  };
  toaster: {
    /** aria-label for the toast region landmark. */
    label: string;
  };
  code: {
    /** aria-label for a code block, e.g. "typescript code". */
    blockLabel: (language: string) => string;
  };
  chart: {
    /** Default aria-label summary, e.g. "line chart with 2 series: Revenue, Cost". */
    summary: (type: string, seriesNames: string[]) => string;
    /** Header for the visually-hidden data table's series column. */
    series: string;
    /** Fallback category label for an unlabeled data point, e.g. "Point 3". */
    point: (index: number) => string;
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
    slide: (index, total) => `${index} of ${total}`,
    slideRoleDescription: 'slide',
  },
  combobox: {
    noResults: 'No results',
    resultCount: (count) =>
      count === 0 ? 'No results' : `${count} result${count === 1 ? '' : 's'} available`,
    loading: 'Loading',
    create: (query) => `Add "${query}"`,
    removeOption: (label) => `Remove ${label}`,
  },
  avatarGroup: {
    overflow: (count) => `${count} more`,
  },
  dataTable: {
    empty: 'No data',
    loading: 'Loading',
    noResults: 'No matching results',
    search: 'Search…',
    searchLabel: 'Search',
    selectedCount: (count) => `${count} selected`,
    clear: 'Clear',
    selectAll: 'Select all rows',
    selectRow: (label) => `Select ${label}`,
    expandRow: (label) => `Expand ${label}`,
    collapseRow: (label) => `Collapse ${label}`,
    resizeColumn: (label) => `Resize ${label} column`,
  },
  fileUpload: {
    multipleFiles: 'You can select multiple files.',
    singleFile: 'Select a single file.',
    accepted: (accept) => `Accepted: ${accept}.`,
  },
  passwordInput: {
    show: 'Show password',
    hide: 'Hide password',
  },
  colorPicker: {
    saturationBrightness: 'Saturation and brightness',
    svValueText: (saturation, brightness, hex) =>
      `${saturation}% saturation, ${brightness}% brightness, ${hex}`,
    hue: 'Hue',
    hueValueText: (degrees) => `${degrees} degrees`,
    alpha: 'Alpha',
    hex: 'Hex',
    selectedColor: (hex) => `Selected color ${hex}`,
    presets: 'Color presets',
  },
  pinInput: {
    digit: (index, length) => `digit ${index} of ${length}`,
  },
  rating: {
    starLabel: (rating) => `${rating} ${rating === 1 ? 'star' : 'stars'}`,
  },
  stepper: {
    completed: '(completed)',
  },
  calendar: {
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
  },
  breadcrumbs: {
    label: 'Breadcrumb',
    more: (count) => (count === 1 ? '1 more breadcrumb' : `${count} more breadcrumbs`),
  },
  chip: {
    remove: (label) => `Remove ${label}`,
    removeGeneric: 'Remove',
  },
  sidebar: {
    label: 'Sidebar',
    expand: 'Expand sidebar',
    collapse: 'Collapse sidebar',
  },
  commandPalette: {
    placeholder: 'Type a command or search…',
    noResults: 'No results',
    label: 'Command menu',
  },
  datePicker: {
    placeholder: 'Select a date…',
    triggerLabel: 'Open calendar',
    dialogLabel: 'Choose date',
  },
  dateRangePicker: {
    startPlaceholder: 'Start date',
    endPlaceholder: 'End date',
    dialogLabel: 'Choose date range',
  },
  timePicker: {
    hour: 'Hour',
    minute: 'Minute',
    second: 'Second',
    dayPeriod: 'AM/PM',
    empty: 'Empty',
  },
  numberField: {
    decrement: 'Decrement',
    increment: 'Increment',
  },
  table: {
    selectAll: 'Select all rows',
    selectRow: (id) => `Select row ${id}`,
  },
  toaster: {
    label: 'Notifications',
  },
  code: {
    blockLabel: (language) => `${language} code`,
  },
  chart: {
    summary: (type, seriesNames) =>
      `${type} chart with ${seriesNames.length} series: ${seriesNames.join(', ')}`,
    series: 'Series',
    point: (index) => `Point ${index}`,
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

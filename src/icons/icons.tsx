import { createIcon } from './createIcon';

// Minimal vendored set covering the 12 components + common app usage.
export const CloseIcon = /* @__PURE__ */ createIcon(
  'CloseIcon',
  <path d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.7 2.88 18.29 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.29-6.3z" />,
);

export const ChevronDownIcon = /* @__PURE__ */ createIcon(
  'ChevronDownIcon',
  <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />,
);

export const CheckIcon = /* @__PURE__ */ createIcon(
  'CheckIcon',
  <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
);

export const InfoIcon = /* @__PURE__ */ createIcon(
  'InfoIcon',
  <path d="M11 9h2V7h-2m1 13a8 8 0 1 1 0-16 8 8 0 0 1 0 16m0-18a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1 15h2v-6h-2z" />,
);

export const WarningIcon = /* @__PURE__ */ createIcon(
  'WarningIcon',
  <path d="M1 21h22L12 2zm12-3h-2v-2h2zm0-4h-2v-4h2z" />,
);

export const ErrorIcon = /* @__PURE__ */ createIcon(
  'ErrorIcon',
  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 15h-2v-2h2zm0-4h-2V7h2z" />,
);

export const MenuIcon = /* @__PURE__ */ createIcon(
  'MenuIcon',
  <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />,
);

export const SearchIcon = /* @__PURE__ */ createIcon(
  'SearchIcon',
  <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14" />,
);

export const UserIcon = /* @__PURE__ */ createIcon(
  'UserIcon',
  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10m0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5" />,
);

// --- App-nav set ------------------------------------------------------------
// Common shell icons (sidebar/topbar). Anything beyond this: use createIcon.

export const HomeIcon = /* @__PURE__ */ createIcon(
  'HomeIcon',
  <path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3z" />,
);

export const DashboardIcon = /* @__PURE__ */ createIcon(
  'DashboardIcon',
  <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />,
);

export const ListIcon = /* @__PURE__ */ createIcon(
  'ListIcon',
  <path d="M8 5h13v2H8zM8 11h13v2H8zM8 17h13v2H8zM3 5h2v2H3zM3 11h2v2H3zM3 17h2v2H3z" />,
);

export const ActivityIcon = /* @__PURE__ */ createIcon(
  'ActivityIcon',
  <path
    d="M3 12h4l3-7 4 14 3-7h4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
);

export const ChartIcon = /* @__PURE__ */ createIcon(
  'ChartIcon',
  <path d="M4 13h4v7H4zm6-6h4v13h-4zm6 3h4v10h-4z" />,
);

export const BotIcon = /* @__PURE__ */ createIcon(
  'BotIcon',
  <path d="M12 2a1 1 0 0 1 1 1v1h2a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h2V3a1 1 0 0 1 1-1M9.5 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M9 16h6v1.5H9z" />,
);

export const SettingsIcon = /* @__PURE__ */ createIcon(
  'SettingsIcon',
  <path d="M19.14 12.94a7.5 7.5 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.27 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.5 7.5 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.34.68.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.26.12.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7" />,
);

export const BellIcon = /* @__PURE__ */ createIcon(
  'BellIcon',
  <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2m6-6V11a6 6 0 0 0-4-5.65V4a2 2 0 0 0-4 0v1.35A6 6 0 0 0 6 11v5l-2 2v1h16v-1z" />,
);

export const PlusIcon = /* @__PURE__ */ createIcon(
  'PlusIcon',
  <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />,
);

export const ChevronRightIcon = /* @__PURE__ */ createIcon(
  'ChevronRightIcon',
  <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />,
);

export const ChevronLeftIcon = /* @__PURE__ */ createIcon(
  'ChevronLeftIcon',
  <path d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z" />,
);

export const ChevronUpIcon = /* @__PURE__ */ createIcon(
  'ChevronUpIcon',
  <path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z" />,
);

export const MoreVerticalIcon = /* @__PURE__ */ createIcon(
  'MoreVerticalIcon',
  <path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4m0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />,
);

export const LogOutIcon = /* @__PURE__ */ createIcon(
  'LogOutIcon',
  <path d="M16 17v-3H9v-2h7V9l5 4zM14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />,
);

export const EyeIcon = /* @__PURE__ */ createIcon(
  'EyeIcon',
  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10m0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6" />,
);

export const EyeOffIcon = /* @__PURE__ */ createIcon(
  'EyeOffIcon',
  <path d="M12 7a5 5 0 0 1 5 5c0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7M2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2m4.31-.78 3.15 3.15.02-.16a3 3 0 0 0-3-3z" />,
);

import { createIcon } from './createIcon';

// Minimal vendored set covering the 12 components + common app usage.
export const CloseIcon = createIcon(
  'CloseIcon',
  <path d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.7 2.88 18.29 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.29-6.3z" />,
);

export const ChevronDownIcon = createIcon(
  'ChevronDownIcon',
  <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />,
);

export const CheckIcon = createIcon(
  'CheckIcon',
  <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
);

export const InfoIcon = createIcon(
  'InfoIcon',
  <path d="M11 9h2V7h-2m1 13a8 8 0 1 1 0-16 8 8 0 0 1 0 16m0-18a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1 15h2v-6h-2z" />,
);

export const WarningIcon = createIcon(
  'WarningIcon',
  <path d="M1 21h22L12 2zm12-3h-2v-2h2zm0-4h-2v-4h2z" />,
);

export const ErrorIcon = createIcon(
  'ErrorIcon',
  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 15h-2v-2h2zm0-4h-2V7h2z" />,
);

export const MenuIcon = createIcon('MenuIcon', <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />);

export const SearchIcon = createIcon(
  'SearchIcon',
  <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14" />,
);

export const UserIcon = createIcon(
  'UserIcon',
  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10m0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5" />,
);

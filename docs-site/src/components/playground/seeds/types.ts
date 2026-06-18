import type { ComponentType } from 'react';

export interface Seed {
  /** The component to render in the preview. */
  Component: ComponentType<any>;
  /** Initial values; merged over auto-derived control defaults. For required or
   *  complex props the controls can't supply (options, columns, label, etc.). */
  props?: Record<string, unknown>;
  /** When defined, a "children" text control appears, seeded with this string. */
  children?: string;
}

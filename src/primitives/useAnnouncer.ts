import { useCallback } from 'react';

export type AnnouncerPoliteness = 'polite' | 'assertive';

// Same visually-hidden recipe as VisuallyHidden, as an inline style string for the
// imperatively-created DOM node (no React render).
const REGION_STYLE =
  'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';

/** Find or lazily create the shared visually-hidden region for a politeness level. */
function regionFor(politeness: AnnouncerPoliteness): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const id = `ku-announcer-${politeness}`;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
    el.setAttribute('aria-live', politeness);
    el.setAttribute('aria-atomic', 'true');
    el.style.cssText = REGION_STYLE;
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Imperatively announce `message` to screen readers via a shared, lazily-created
 * visually-hidden live region appended to `<body>` (one per politeness level).
 * Use for fire-and-forget announcements (async state, filtered-result counts)
 * where there is no element to host a declarative `<LiveRegion>`. SSR-safe: it
 * no-ops when there is no `document`.
 */
export function announce(message: string, politeness: AnnouncerPoliteness = 'polite'): void {
  const region = regionFor(politeness);
  if (!region) return;
  // Clear first so re-announcing the same string still registers as a change, then
  // set it on a later tick so assistive tech observes the mutation.
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 50);
}

/**
 * Returns a stable `announce(message, politeness?)` callback. Thin hook wrapper
 * over {@link announce} so components can announce without importing it directly.
 */
export function useAnnouncer(): (message: string, politeness?: AnnouncerPoliteness) => void {
  return useCallback(announce, []);
}

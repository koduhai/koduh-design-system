import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { VisuallyHidden } from './VisuallyHidden';

export type LiveRegionPoliteness = 'polite' | 'assertive';

export interface LiveRegionProps extends HTMLAttributes<HTMLSpanElement> {
  /** Announcement urgency: 'assertive' interrupts, 'polite' waits. Default 'polite'. */
  politeness?: LiveRegionPoliteness;
  /** Announce the region's whole text on any change (default true). */
  atomic?: boolean;
}

/**
 * A visually-hidden ARIA live region for declarative, state-driven announcements:
 * render the current message as `children` and update it when it changes; screen
 * readers announce the new text. Use this when a component already tracks the
 * message in state (e.g. "Slide 2 of 5"). For imperative, fire-and-forget
 * announcements with no element to host them, use {@link useAnnouncer} instead.
 */
export const LiveRegion = /* @__PURE__ */ forwardRef<HTMLSpanElement, LiveRegionProps>(
  function LiveRegion({ politeness = 'polite', atomic = true, ...props }, ref) {
    return (
      <VisuallyHidden
        ref={ref}
        role={politeness === 'assertive' ? 'alert' : 'status'}
        aria-live={politeness}
        aria-atomic={atomic}
        {...props}
      />
    );
  },
);

import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';

const hiddenStyle: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/** Visually hides content while keeping it available to screen readers. */
export const VisuallyHidden = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function VisuallyHidden({ style, ...props }, ref) {
    return <span ref={ref} style={{ ...hiddenStyle, ...style }} {...props} />;
  },
);

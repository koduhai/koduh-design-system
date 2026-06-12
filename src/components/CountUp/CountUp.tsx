import { forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes } from 'react';

export interface CountUpProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Target value to animate to. */
  value: number;
  /** Starting value for the first animation. Defaults to 0. */
  from?: number;
  /** Animation duration in ms. Defaults to 800. `0` renders instantly. */
  duration?: number;
  /** Fixed decimal places when no `format` is given. Defaults to 0. */
  decimals?: number;
  /** Custom formatter (e.g. currency/percent). Overrides `decimals`. */
  format?: (n: number) => string;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export const CountUp = /* @__PURE__ */ forwardRef<HTMLSpanElement, CountUpProps>(function CountUp(
  { value, from = 0, duration = 800, decimals = 0, format, ...props },
  ref,
) {
  const [display, setDisplay] = useState(from);
  // Mirrors the latest rendered value so an interrupting `value` change tweens
  // from what is currently on screen (not the original start, which would jump back).
  const displayRef = useRef(from);
  displayRef.current = display;

  useEffect(() => {
    // Start the tween from the currently displayed value so a mid-animation
    // `value` change continues forward instead of snapping back to the prior start.
    const start = displayRef.current;
    if (duration <= 0 || prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setDisplay(start + (value - start) * easeOut(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const text = format ? format(display) : display.toFixed(decimals);
  return (
    <span ref={ref} {...props}>
      {text}
    </span>
  );
});

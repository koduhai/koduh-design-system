import { forwardRef, useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { mergeRefs, useControllableState, useId, LiveRegion } from '../../primitives';
import { useMessages } from '../../i18n';
import { cx } from '../../utils/cx';
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons';
import styles from './Carousel.module.css';

export interface CarouselItem {
  /** Stable identity for the slide. */
  id: string;
  /** Slide body. */
  content: ReactNode;
}

export interface CarouselProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Slides, in display order. */
  items: CarouselItem[];
  /** Initial slide index when uncontrolled. Defaults to 0. */
  defaultIndex?: number;
  /** Controlled active slide index. */
  index?: number;
  /** Fires with the next active index on navigation. */
  onIndexChange?: (index: number) => void;
  /** Wrap around past the first/last slide. Defaults to false. */
  loop?: boolean;
  /** Accessible name for the carousel region. */
  'aria-label'?: string;
  /** Label for the previous-slide control. Defaults to the i18n catalog ('Previous slide'). */
  prevLabel?: string;
  /** Label for the next-slide control. Defaults to the i18n catalog ('Next slide'). */
  nextLabel?: string;
}

/** `ref` forwards to the root region element. */
export const Carousel = /* @__PURE__ */ forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
  {
    items,
    defaultIndex = 0,
    index,
    onIndexChange,
    loop = false,
    prevLabel,
    nextLabel,
    className,
    onKeyDown,
    tabIndex,
    ...props
  },
  ref,
) {
  const messages = useMessages();
  const baseId = useId('carousel');
  const rootRef = useRef<HTMLDivElement>(null);
  const count = items.length;

  const [active, setActive] = useControllableState<number>({
    value: index,
    defaultValue: defaultIndex,
    onChange: onIndexChange,
  });

  // Clamp into range so out-of-bounds props/empty lists never crash indexing.
  const safeActive = count === 0 ? 0 : Math.min(Math.max(active, 0), count - 1);

  const goTo = (next: number) => {
    if (count === 0) return;
    let target = next;
    if (target < 0) target = loop ? count - 1 : 0;
    else if (target > count - 1) target = loop ? 0 : count - 1;
    // Skip no-op navigations (active indicator click, clamped boundary) so
    // consumers don't get spurious onIndexChange notifications.
    if (target === safeActive) return;
    setActive(target);
  };

  const atStart = safeActive === 0;
  const atEnd = safeActive === count - 1;
  const prevDisabled = count === 0 || (!loop && atStart);
  const nextDisabled = count === 0 || (!loop && atEnd);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    // In RTL the next slide sits to the left, so the horizontal arrows swap.
    const rtl =
      typeof window !== 'undefined' && rootRef.current
        ? getComputedStyle(rootRef.current).direction === 'rtl'
        : false;
    const forward = rtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
    event.preventDefault();
    goTo(safeActive + (forward ? 1 : -1));
  };

  const slideId = (i: number) => `${baseId}-slide-${i}`;

  return (
    <div
      ref={mergeRefs(ref, rootRef)}
      role="group"
      aria-roledescription={messages.carousel.region}
      className={cx(styles.root, className)}
      tabIndex={tabIndex ?? 0}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <LiveRegion>
        {count === 0 ? '' : messages.carousel.slideStatus(safeActive + 1, count)}
      </LiveRegion>

      <div className={styles.viewport}>
        {items.map((item, i) => (
          <div
            key={item.id}
            id={slideId(i)}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            className={styles.slide}
            data-active={i === safeActive ? 'true' : undefined}
            aria-hidden={i === safeActive ? undefined : 'true'}
            inert={i === safeActive ? undefined : true}
          >
            {item.content}
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.nav}
          aria-label={prevLabel ?? messages.carousel.previous}
          disabled={prevDisabled}
          onClick={() => goTo(safeActive - 1)}
        >
          <ChevronLeftIcon aria-hidden />
        </button>

        <div className={styles.indicators} role="group" aria-label={messages.carousel.label}>
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={styles.indicator}
              aria-label={messages.carousel.goToSlide(i + 1)}
              aria-current={i === safeActive ? 'true' : undefined}
              data-active={i === safeActive ? 'true' : undefined}
              aria-controls={slideId(i)}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.nav}
          aria-label={nextLabel ?? messages.carousel.next}
          disabled={nextDisabled}
          onClick={() => goTo(safeActive + 1)}
        >
          <ChevronRightIcon aria-hidden />
        </button>
      </div>
    </div>
  );
});

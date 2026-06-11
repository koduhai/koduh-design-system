import { forwardRef, useRef, useState, createElement } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import type { HeadingLevel } from '../../utils/headingLevel';
import { ChevronDownIcon } from '../../icons';
import styles from './Accordion.module.css';

export type { HeadingLevel };

export interface AccordionItemData {
  /** Stable identity; used as the controlled/uncontrolled value. */
  id: string;
  /** Content rendered inside the disclosure trigger button. */
  title: ReactNode;
  /** Content revealed when the item is expanded. */
  content: ReactNode;
  /** Disables the trigger; the panel cannot be opened while disabled. */
  disabled?: boolean;
}

export interface AccordionProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** The sections to render. */
  items: AccordionItemData[];
  /** Expanded item id(s). string for single-mode, string[] for multiple. */
  value?: string | string[];
  /** Initial expanded id(s) when uncontrolled. */
  defaultValue?: string | string[];
  /** Fires with the new expanded id (single) or ids (multiple). */
  onChange?: (value: string | string[]) => void;
  /** Allow multiple panels open at once. Defaults to false. */
  multiple?: boolean;
  /** Single-mode: allow closing the open item. Defaults to true. */
  collapsible?: boolean;
  /**
   * Defer rendering a collapsed panel's content until it is first expanded.
   * Defaults to `false` (eager — every panel's content is rendered up front).
   */
  lazy?: boolean;
  /**
   * Once a panel has been expanded, keep its content mounted (hidden via
   * `hidden`/CSS) instead of unmounting it when collapsed again. Defaults to
   * `false`.
   */
  keepMounted?: boolean;
  /**
   * Semantic heading level (`<h2>`–`<h6>`) wrapping each trigger, so the
   * accordion aligns with the surrounding document outline. Defaults to `3`.
   */
  headingLevel?: HeadingLevel;
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

export const Accordion = /* @__PURE__ */ forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(
    {
      items,
      value,
      defaultValue,
      onChange,
      multiple = false,
      collapsible = true,
      lazy = false,
      keepMounted = false,
      headingLevel = 3,
      className,
      ...props
    },
    ref,
  ) {
    const baseId = useId('accordion');

    // Refs to each trigger button, indexed by item position, for the
    // WAI-ARIA Accordion arrow-key roving-focus pattern.
    const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const fallbackDefault: string | string[] = multiple ? [] : '';
    const [state, setState] = useControllableState<string | string[]>({
      value,
      defaultValue: defaultValue ?? fallbackDefault,
      onChange: undefined,
    });

    const expandedIds = toArray(state);

    // Track which panels have ever been expanded. Used by `lazy` (defer first
    // render until expanded) and `keepMounted` (stay mounted once expanded).
    // Currently-expanded panels are always considered shown.
    const [shownIds, setShownIds] = useState<Set<string>>(() => new Set(expandedIds));
    const unseen = expandedIds.filter((id) => !shownIds.has(id));
    if (unseen.length > 0) {
      setShownIds((prev) => {
        const next = new Set(prev);
        for (const id of unseen) next.add(id);
        return next;
      });
    }

    const toggle = (id: string) => {
      const isOpen = expandedIds.includes(id);
      let next: string | string[];
      if (multiple) {
        next = isOpen ? expandedIds.filter((x) => x !== id) : [...expandedIds, id];
      } else {
        // Single mode: clicking the already-open item closes it only when
        // `collapsible` is true; otherwise the open item stays open.
        next = isOpen ? (collapsible ? '' : id) : id;
      }
      setState(next);
      onChange?.(next);
    };

    // WAI-ARIA Accordion keyboard pattern: ArrowDown/ArrowUp move focus to the
    // next/previous enabled header, wrapping around; Home/End jump to the
    // first/last enabled header. Tab/Enter/Space keep their native button
    // behaviour, so we only intercept the cross-header navigation keys.
    const focusTriggerAt = (start: number, direction: 1 | -1) => {
      const count = items.length;
      for (let step = 1; step <= count; step += 1) {
        const idx = (((start + direction * step) % count) + count) % count;
        if (!items[idx]?.disabled) {
          triggerRefs.current[idx]?.focus();
          return;
        }
      }
    };

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusTriggerAt(index, 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusTriggerAt(index, -1);
          break;
        case 'Home':
          event.preventDefault();
          focusTriggerAt(-1, 1);
          break;
        case 'End':
          event.preventDefault();
          focusTriggerAt(items.length, -1);
          break;
        default:
          break;
      }
    };

    return (
      <div ref={ref} className={cx(styles.root, className)} {...props}>
        {items.map((item, index) => {
          const expanded = expandedIds.includes(item.id);
          const shown = expanded || shownIds.has(item.id);
          const headerId = `${baseId}-${index}-header`;
          const panelId = `${baseId}-${index}-panel`;
          // The panel region element always stays mounted so the trigger's
          // `aria-controls` target and region labelling remain stable;
          // visibility is driven by `hidden` as before. Only the panel's
          // *content* is gated by lazy/keepMounted:
          //   - eager (default): always render content (back-compatible).
          //   - lazy, never expanded: omit content until first expand.
          //   - lazy, expanded before but now collapsed: drop content unless
          //     keepMounted.
          let renderContent: boolean;
          if (expanded) {
            renderContent = true;
          } else if (!lazy) {
            renderContent = true;
          } else {
            renderContent = shown && keepMounted;
          }
          return (
            <div
              key={item.id}
              className={styles.item}
              data-expanded={expanded ? 'true' : undefined}
            >
              {createElement(
                `h${headingLevel}`,
                { className: styles.heading },
                <button
                  type="button"
                  ref={(node: HTMLButtonElement | null) => {
                    triggerRefs.current[index] = node;
                  }}
                  id={headerId}
                  className={styles.trigger}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  disabled={item.disabled}
                  data-expanded={expanded ? 'true' : undefined}
                  onClick={() => toggle(item.id)}
                  onKeyDown={(event) => handleTriggerKeyDown(event, index)}
                >
                  <span className={styles.title}>{item.title}</span>
                  <ChevronDownIcon
                    className={styles.chevron}
                    size={20}
                    data-expanded={expanded ? 'true' : undefined}
                    aria-hidden
                  />
                </button>,
              )}
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className={styles.panel}
                hidden={!expanded}
              >
                <div className={styles.content}>{renderContent ? item.content : null}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

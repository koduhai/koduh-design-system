import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { ChevronDownIcon } from '../../icons';
import styles from './Accordion.module.css';

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
      className,
      ...props
    },
    ref,
  ) {
    const baseId = useId('accordion');

    const fallbackDefault: string | string[] = multiple ? [] : '';
    const [state, setState] = useControllableState<string | string[]>({
      value,
      defaultValue: defaultValue ?? fallbackDefault,
      onChange: undefined,
    });

    const expandedIds = toArray(state);

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

    return (
      <div ref={ref} className={cx(styles.root, className)} {...props}>
        {items.map((item, index) => {
          const expanded = expandedIds.includes(item.id);
          const headerId = `${baseId}-${index}-header`;
          const panelId = `${baseId}-${index}-panel`;
          return (
            <div
              key={item.id}
              className={styles.item}
              data-expanded={expanded ? 'true' : undefined}
            >
              <h3 className={styles.heading}>
                <button
                  type="button"
                  id={headerId}
                  className={styles.trigger}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  disabled={item.disabled}
                  data-expanded={expanded ? 'true' : undefined}
                  onClick={() => toggle(item.id)}
                >
                  <span className={styles.title}>{item.title}</span>
                  <ChevronDownIcon
                    className={styles.chevron}
                    size={20}
                    data-expanded={expanded ? 'true' : undefined}
                    aria-hidden
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className={styles.panel}
                hidden={!expanded}
              >
                <div className={styles.content}>{item.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

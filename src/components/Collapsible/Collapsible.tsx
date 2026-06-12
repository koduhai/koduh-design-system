import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { ChevronDownIcon } from '../../icons';
import styles from './Collapsible.module.css';

export interface CollapsibleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Content rendered inside the disclosure trigger button. */
  trigger: ReactNode;
  /** Content revealed when expanded. */
  children: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to false. */
  defaultOpen?: boolean;
  /** Fires with the new open state on toggle. */
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger; the panel cannot be toggled while disabled. */
  disabled?: boolean;
}

export const Collapsible = /* @__PURE__ */ forwardRef<HTMLDivElement, CollapsibleProps>(
  function Collapsible(
    { trigger, children, open, defaultOpen, onOpenChange, disabled = false, className, ...props },
    ref,
  ) {
    const baseId = useId('collapsible');
    const panelId = `${baseId}-panel`;
    const triggerId = `${baseId}-trigger`;

    const [state, setState] = useControllableState<boolean>({
      value: open,
      defaultValue: defaultOpen ?? false,
      onChange: undefined,
    });

    const toggle = () => {
      const next = !state;
      setState(next);
      onOpenChange?.(next);
    };

    return (
      <div
        ref={ref}
        className={cx(styles.root, className)}
        data-open={state ? 'true' : undefined}
        {...props}
      >
        <button
          type="button"
          id={triggerId}
          className={styles.trigger}
          aria-expanded={state}
          aria-controls={panelId}
          disabled={disabled}
          data-open={state ? 'true' : undefined}
          onClick={toggle}
        >
          <span className={styles.label}>{trigger}</span>
          <ChevronDownIcon
            className={styles.chevron}
            size={20}
            data-open={state ? 'true' : undefined}
            aria-hidden
          />
        </button>
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className={styles.panel}
          hidden={!state}
        >
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    );
  },
);

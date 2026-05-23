import { forwardRef, useEffect, useRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { mergeRefs, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Checkbox.module.css';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'checked' | 'defaultChecked' | 'onChange'
> {
  /** Label rendered next to the box; the whole label is the click target. */
  label?: ReactNode;
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state when uncontrolled. */
  defaultChecked?: boolean;
  /** Visually + a11y indeterminate; set on the DOM node via ref, not an attribute. */
  indeterminate?: boolean;
  /** Fires with the new checked state (and the native event). */
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Defaults to 'md'. */
  size?: CheckboxSize;
  /** Puts the control in the error state (aria-invalid). */
  error?: boolean;
}

export const Checkbox = /* @__PURE__ */ forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      checked,
      defaultChecked,
      indeterminate = false,
      onChange,
      size = 'md',
      error = false,
      disabled,
      className,
      ...props
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [state, setState] = useControllableState<boolean>({
      value: checked,
      defaultValue: defaultChecked ?? false,
      onChange: undefined,
    });

    // `indeterminate` is a DOM property only (not a reflectable HTML attribute),
    // so it must be set imperatively via the ref rather than through JSX.
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    return (
      <label
        className={cx(styles.root, className)}
        data-size={size}
        data-disabled={disabled ? 'true' : undefined}
        data-error={error ? 'true' : undefined}
      >
        <input
          ref={mergeRefs(inputRef, ref)}
          type="checkbox"
          className={styles.input}
          checked={state}
          disabled={disabled}
          aria-invalid={error || undefined}
          onChange={(event) => {
            setState(event.target.checked);
            onChange?.(event.target.checked, event);
          }}
          {...props}
        />
        <span
          className={styles.box}
          aria-hidden
          data-checked={state ? 'true' : undefined}
          data-indeterminate={indeterminate ? 'true' : undefined}
          data-size={size}
          data-error={error ? 'true' : undefined}
        >
          <svg
            className={styles.check}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {indeterminate ? (
              <line x1="3.5" y1="8" x2="12.5" y2="8" />
            ) : (
              <polyline points="3.5,8.5 6.5,11.5 12.5,4.5" />
            )}
          </svg>
        </span>
        {label != null ? <span className={styles.label}>{label}</span> : null}
      </label>
    );
  },
);

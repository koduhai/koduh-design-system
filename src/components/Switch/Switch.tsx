import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Switch.module.css';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'checked' | 'defaultChecked' | 'onChange' | 'type'
> {
  /** Label rendered beside the control and used as the accessible name. */
  label?: ReactNode;
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state when uncontrolled. */
  defaultChecked?: boolean;
  /** Fires on toggle with the new checked value (and the native event). */
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Defaults to 'md'. */
  size?: SwitchSize;
}

export const Switch = /* @__PURE__ */ forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, checked, defaultChecked, onChange, size = 'md', className, disabled, ...props },
  ref,
) {
  const [state, setState] = useControllableState<boolean>({
    value: checked,
    defaultValue: defaultChecked ?? false,
    onChange: undefined,
  });

  return (
    <label
      className={cx(styles.root, className)}
      data-size={size}
      data-checked={state ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={state}
        disabled={disabled}
        onChange={(event) => {
          setState(event.target.checked);
          onChange?.(event.target.checked, event);
        }}
        {...props}
      />
      <span className={styles.track} aria-hidden>
        <span className={styles.thumb} />
      </span>
      {label != null ? <span className={styles.label}>{label}</span> : null}
    </label>
  );
});

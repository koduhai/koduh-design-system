import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFieldContext } from '../FormField';
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
  { label, checked, defaultChecked, onChange, onBlur, size = 'md', className, disabled, id: idProp, ...props },
  ref,
) {
  const field = useOptionalFieldContext();
  const id = field?.id ?? idProp;
  const [state, setState] = useControllableState<boolean>({
    value: checked,
    defaultValue: defaultChecked ?? false,
    onChange: undefined,
  });

  // Bind to an enclosing <Form> only when the consumer didn't pass a controlled
  // `checked`. Switch value semantics = checked boolean.
  const bound = checked === undefined ? field?.binding : undefined;
  const isChecked = bound ? Boolean(bound.value) : state;
  const invalid = field?.invalid ?? false;

  return (
    <label
      className={cx(styles.root, className)}
      data-size={size}
      data-checked={isChecked ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={isChecked}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={(event) => {
          if (bound) bound.onChange(event.target.checked, event);
          else setState(event.target.checked);
          onChange?.(event.target.checked, event);
        }}
        onBlur={(e) => {
          bound?.onBlur();
          onBlur?.(e);
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

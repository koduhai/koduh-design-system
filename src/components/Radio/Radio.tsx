import { createContext, forwardRef, useContext } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Radio.module.css';

export interface RadioGroupContextValue {
  name: string;
  value: string | undefined;
  onChange: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Shared by RadioGroup to its descendant Radios. Kept in-folder. */
export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  /** Value submitted/compared when this radio is selected. */
  value: string;
  /** Visible label, wraps the control so its text is part of the click target. */
  label?: ReactNode;
  /** Disable this single option. */
  disabled?: boolean;
}

export const Radio = /* @__PURE__ */ forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { value, label, disabled = false, className, id: idProp, ...props },
  ref,
) {
  const ctx = useContext(RadioGroupContext);
  const reactId = useId('radio');
  const id = idProp ?? reactId;

  const checked = ctx ? ctx.value === value : undefined;

  return (
    <label
      className={cx(styles.root, className)}
      htmlFor={id}
      data-disabled={disabled || undefined}
    >
      <input
        ref={ref}
        id={id}
        type="radio"
        className={styles.input}
        name={ctx?.name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          ctx?.onChange(value, event);
        }}
        {...props}
      />
      <span className={styles.circle} aria-hidden data-checked={checked || undefined} />
      {label != null ? <span className={styles.label}>{label}</span> : null}
    </label>
  );
});

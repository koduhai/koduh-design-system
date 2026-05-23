import { forwardRef, useMemo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { RadioGroupContext } from './Radio';
import type { RadioGroupContextValue } from './Radio';
import styles from './Radio.module.css';

export interface RadioGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Shared `name` for the underlying radios. Defaults to a useId-generated name. */
  name?: string;
  /** Controlled selected value. */
  value?: string;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string;
  /** Fires with the newly selected value (and the native change event). */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Layout + a11y orientation. Defaults to 'vertical'. */
  orientation?: 'horizontal' | 'vertical';
  /** Accessible group label, rendered as a <span> referenced by aria-labelledby. */
  label?: ReactNode;
}

export const RadioGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup(
    {
      name: nameProp,
      value,
      defaultValue,
      onChange,
      orientation = 'vertical',
      label,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const reactName = useId('radio-group');
    const name = nameProp ?? reactName;
    const labelId = useId('radio-group-label');

    const [state, setState] = useControllableState<string | undefined>({
      value,
      defaultValue,
      onChange: undefined,
    });

    const ctx = useMemo<RadioGroupContextValue>(
      () => ({
        name,
        value: state,
        onChange: (next, event) => {
          setState(next);
          onChange?.(next, event);
        },
      }),
      [name, state, setState, onChange],
    );

    return (
      <RadioGroupContext.Provider value={ctx}>
        <div
          ref={ref}
          role="radiogroup"
          aria-orientation={orientation}
          aria-labelledby={label ? labelId : undefined}
          className={cx(styles.group, className)}
          data-orientation={orientation}
          {...props}
        >
          {label != null ? (
            <span id={labelId} className={styles.groupLabel}>
              {label}
            </span>
          ) : null}
          <div className={styles.options} data-orientation={orientation}>
            {children}
          </div>
        </div>
      </RadioGroupContext.Provider>
    );
  },
);

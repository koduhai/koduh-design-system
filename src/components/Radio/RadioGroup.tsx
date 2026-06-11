import { forwardRef, useMemo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFieldContext } from '../FormField';
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
    const ownLabelId = useId('radio-group-label');
    const field = useOptionalFieldContext();

    const [state, setState] = useControllableState<string | undefined>({
      value,
      defaultValue,
      onChange: undefined,
    });

    // Bind to an enclosing <Form> only when the consumer didn't pass a controlled
    // `value`. RadioGroup value semantics = the selected radio value (string).
    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? (bound.value as string | undefined) : state;
    // Inside a <FormField>, defer the group label/id to it; otherwise own them.
    const showOwnLabel = !field;
    const labelId = field ? field.labelId : ownLabelId;
    const groupId = field?.id;

    const ctx = useMemo<RadioGroupContextValue>(
      () => ({
        name,
        value: currentValue,
        onChange: (next, event) => {
          if (bound) bound.onChange(next, event);
          else setState(next);
          onChange?.(next, event);
        },
      }),
      [name, currentValue, bound, setState, onChange],
    );

    return (
      <RadioGroupContext.Provider value={ctx}>
        <div
          ref={ref}
          id={groupId}
          role="radiogroup"
          aria-orientation={orientation}
          aria-labelledby={field ? labelId : label ? labelId : undefined}
          aria-describedby={field?.describedById}
          aria-invalid={field?.invalid || undefined}
          aria-required={field?.required || undefined}
          className={cx(styles.group, className)}
          data-orientation={orientation}
          {...props}
        >
          {showOwnLabel && label != null ? (
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

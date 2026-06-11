import { forwardRef, useLayoutEffect, useRef } from 'react';
import type { ChangeEvent, ReactNode, TextareaHTMLAttributes } from 'react';
import { mergeRefs, useId, useControllableState } from '../../primitives';
import { useOptionalFieldContext } from '../FormField';
import { cx } from '../../utils/cx';
import styles from './Textarea.module.css';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size' | 'value' | 'defaultValue' | 'onChange'
> {
  /**
   * Visible label, associated with the textarea via htmlFor/id.
   * Provide `label`, or wrap the control in a `<FormField>` which supplies it.
   */
  label?: ReactNode;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Fires on every keystroke with the new value (and the native event). */
  onChange?: (value: string, event: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Hint shown below the field. Hidden when an error is shown. */
  helperText?: ReactNode;
  /** Puts the field in the error state (aria-invalid). */
  error?: boolean;
  /** Message shown below the field when `error` is set; replaces helperText. */
  errorText?: ReactNode;
  /** Defaults to 'md'. */
  size?: TextareaSize;
  /** Grow the height to fit content. Default false. */
  autoResize?: boolean;
  /** Minimum rows when autoResize is on. Default 2. */
  minRows?: number;
  /** Maximum rows when autoResize is on; scrolls beyond. */
  maxRows?: number;
}

export const Textarea = /* @__PURE__ */ forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      value,
      defaultValue,
      onChange,
      onBlur,
      helperText,
      error = false,
      errorText,
      size = 'md',
      autoResize = false,
      minRows = 2,
      maxRows,
      required,
      rows,
      className,
      id: idProp,
      ...props
    },
    ref,
  ) {
    const reactId = useId('textarea');
    const field = useOptionalFieldContext();
    // When inside a <FormField>, defer label/required/aria to it; otherwise use own props.
    const id = field?.id ?? idProp ?? reactId;
    const descriptionId = `${id}-description`;
    const invalid = field ? field.invalid : error;
    const isRequired = field ? field.required : required;
    const showOwnLabel = !field; // FormField renders the label when present
    const innerRef = useRef<HTMLTextAreaElement>(null);

    const [state, setState] = useControllableState<string>({
      value,
      defaultValue: defaultValue ?? '',
      onChange: undefined,
    });

    const bound = value === undefined ? field?.binding : undefined;
    const currentValue = bound ? ((bound.value as string) ?? '') : state;

    const description = error ? errorText : helperText;
    const describedBy = field
      ? field.describedById
      : description != null
        ? descriptionId
        : undefined;

    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      if (!autoResize) {
        // autoResize was toggled off: drop any inline sizing we applied so the
        // textarea reverts to its CSS/rows-driven height instead of staying
        // frozen at its last auto-sized height/overflow.
        el.style.height = '';
        el.style.overflowY = '';
        return;
      }
      const cs = window.getComputedStyle(el);
      const lineHeight = parseFloat(cs.lineHeight) || 20;
      const vPad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) || 0;
      const vBorder = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) || 0;
      const minH = lineHeight * minRows + vPad + vBorder;
      const maxH = maxRows ? lineHeight * maxRows + vPad + vBorder : Infinity;
      el.style.height = 'auto';
      // Capture the natural height while unconstrained — reading scrollHeight
      // again after applying the clamped height would report the pre-clamp value
      // (no reflow happens synchronously) and misfire the overflow toggle.
      const naturalH = el.scrollHeight;
      const next = Math.min(Math.max(naturalH, minH), maxH);
      el.style.height = `${next}px`;
      el.style.overflowY = naturalH > maxH ? 'auto' : 'hidden';
    }, [currentValue, autoResize, minRows, maxRows]);

    return (
      <div
        className={cx(styles.root, className)}
        data-size={size}
        data-error={invalid ? 'true' : undefined}
      >
        {showOwnLabel && label != null ? (
          <label className={styles.label} htmlFor={id}>
            {label}
            {isRequired ? (
              <span className={styles.required} aria-hidden>
                {' '}
                *
              </span>
            ) : null}
          </label>
        ) : null}
        <textarea
          ref={mergeRefs(innerRef, ref)}
          id={id}
          className={styles.input}
          value={currentValue}
          rows={autoResize ? minRows : rows}
          style={autoResize ? { resize: 'none' } : undefined}
          required={isRequired}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            const next = event.target.value;
            if (bound) bound.onChange(next, event);
            else setState(next);
            onChange?.(next, event);
          }}
          onBlur={(e) => {
            bound?.onBlur();
            onBlur?.(e);
          }}
          {...props}
        />
        {showOwnLabel && description ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);

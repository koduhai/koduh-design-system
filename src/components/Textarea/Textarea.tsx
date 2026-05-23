import { forwardRef, useLayoutEffect, useRef } from 'react';
import type { ChangeEvent, ReactNode, TextareaHTMLAttributes } from 'react';
import { mergeRefs, useId, useControllableState } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './Textarea.module.css';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size' | 'value' | 'defaultValue' | 'onChange'
> {
  /** Visible label, associated with the textarea via htmlFor/id. */
  label: string;
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
    const id = idProp ?? reactId;
    const descriptionId = `${id}-description`;
    const innerRef = useRef<HTMLTextAreaElement>(null);

    const [state, setState] = useControllableState<string>({
      value,
      defaultValue: defaultValue ?? '',
      onChange: undefined,
    });

    const description = error ? errorText : helperText;

    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el || !autoResize) return;
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
    }, [state, autoResize, minRows, maxRows]);

    return (
      <div
        className={cx(styles.root, className)}
        data-size={size}
        data-error={error ? 'true' : undefined}
      >
        <label className={styles.label} htmlFor={id}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden>
              {' '}
              *
            </span>
          ) : null}
        </label>
        <textarea
          ref={mergeRefs(innerRef, ref)}
          id={id}
          className={styles.input}
          value={state}
          rows={autoResize ? minRows : rows}
          style={autoResize ? { resize: 'none' } : undefined}
          required={required}
          aria-invalid={error || undefined}
          aria-describedby={description ? descriptionId : undefined}
          onChange={(event) => {
            setState(event.target.value);
            onChange?.(event.target.value, event);
          }}
          {...props}
        />
        {description ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);

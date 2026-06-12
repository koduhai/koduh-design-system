import { forwardRef, useRef } from 'react';
import type { ClipboardEvent, FocusEvent, HTMLAttributes, KeyboardEvent, ChangeEvent } from 'react';
import { useControllableState, useId } from '../../primitives';
import { useOptionalFieldContext } from '../FormField';
import { cx } from '../../utils/cx';
import { useMessages } from '../../i18n';
import styles from './PinInput.module.css';

export type PinInputSize = 'sm' | 'md' | 'lg';

export interface PinInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'children' | 'onBlur'
> {
  /** Number of cells. Defaults to 6. */
  length?: number;
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fires with the full string whenever any cell changes. */
  onChange?: (value: string) => void;
  /** Fires once the last cell is filled (value length === length). */
  onComplete?: (value: string) => void;
  /** Constrains accepted characters. Defaults to 'number'. */
  type?: 'number' | 'text';
  /** Render cells as password dots. */
  mask?: boolean;
  disabled?: boolean;
  /** Defaults to 'md'. */
  size?: PinInputSize;
  /** Accessible name for the group (when not inside a <FormField>). */
  'aria-label'?: string;
  /** Called when any cell loses focus. */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
}

const isNumberChar = (c: string) => c >= '0' && c <= '9';

/** `ref` forwards to the group container. */
export const PinInput = /* @__PURE__ */ forwardRef<HTMLDivElement, PinInputProps>(function PinInput(
  {
    length = 6,
    value,
    defaultValue,
    onChange,
    onBlur,
    onComplete,
    type = 'number',
    mask = false,
    disabled = false,
    size = 'md',
    className,
    id: idProp,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const reactId = useId('pininput');
  const messages = useMessages();
  const field = useOptionalFieldContext();
  const groupId = field?.id ?? idProp ?? reactId;
  const describedBy = field?.describedById ?? ariaDescribedBy;
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const [val, setVal] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? '',
  });

  const bound = value === undefined ? field?.binding : undefined;
  const currentVal = bound ? ((bound.value as string) ?? '') : val;

  // Track the previously-committed filled length so onComplete fires only on the
  // incomplete -> complete transition, not on every keystroke while already full
  // (overwriting a filled cell keeps length === length and must not re-fire).
  const prevFilledRef = useRef(currentVal.slice(0, length).length);

  // Char array, fixed to `length`, padded with empty strings.
  const chars = Array.from({ length }, (_, i) => currentVal[i] ?? '');

  const accept = (c: string) => (type === 'number' ? isNumberChar(c) : c.length === 1);

  const commit = (next: string) => {
    const trimmed = next.slice(0, length);
    if (bound) bound.onChange(trimmed);
    else setVal(trimmed);
    onChange?.(trimmed);
    // Fire onComplete only when crossing from incomplete (< length) to complete
    // (=== length). Editing an already-full PIN keeps the length at `length` and
    // must not re-fire (which would duplicate-submit).
    const prevFilled = prevFilledRef.current;
    prevFilledRef.current = trimmed.length;
    if (trimmed.length === length && prevFilled < length) onComplete?.(trimmed);
  };

  const focusCell = (index: number) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const setCharAt = (index: number, char: string) => {
    const arr = chars.slice();
    arr[index] = char;
    // Reconstruct as a contiguous string. Empty cells join to '' on their own,
    // so no trimming is needed (and trimming would drop legitimate spaces in a
    // text PIN).
    return arr.join('');
  };

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      commit(setCharAt(index, ''));
      return;
    }
    // Use the last typed char (handles overwrite of an already-filled cell).
    const char = raw.slice(-1);
    if (!accept(char)) return;
    const next = setCharAt(index, char);
    commit(next);
    if (index < length - 1) focusCell(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (chars[index]) {
        // Clear the current cell, stay put.
        commit(setCharAt(index, ''));
      } else if (index > 0) {
        // Empty cell: clear the previous one and move back.
        e.preventDefault();
        commit(setCharAt(index - 1, ''));
        focusCell(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusCell(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusCell(index + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusCell(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusCell(length - 1);
    } else if (e.key === 'Delete') {
      commit(setCharAt(index, ''));
    }
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const accepted = Array.from(pasted).filter(accept);
    if (accepted.length === 0) return;
    const arr = chars.slice();
    let cursor = index;
    for (const c of accepted) {
      if (cursor >= length) break;
      arr[cursor] = c;
      cursor += 1;
    }
    const next = arr.join('');
    commit(next);
    // Focus the cell after the last filled one (clamped).
    focusCell(Math.min(cursor, length - 1));
  };

  const invalid = field?.invalid ?? false;
  const required = field?.required ?? false;

  return (
    <div
      ref={ref}
      id={groupId}
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={describedBy}
      className={cx(styles.root, className)}
      data-size={size}
      data-disabled={disabled ? 'true' : undefined}
      {...rest}
    >
      {chars.map((char, i) => (
        <input
          // Cells are positional; keying by index is correct and stable here.
          key={i}
          ref={(node) => {
            inputsRef.current[i] = node;
          }}
          className={styles.cell}
          type={mask ? 'password' : 'text'}
          inputMode={type === 'number' ? 'numeric' : 'text'}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          pattern={type === 'number' ? '[0-9]*' : undefined}
          maxLength={1}
          value={char}
          disabled={disabled}
          required={required && i === 0}
          aria-invalid={invalid || undefined}
          aria-label={`${ariaLabel ? `${ariaLabel} ` : ''}${messages.pinInput.digit(i + 1, length)}`}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => {
            bound?.onBlur();
            onBlur?.(e);
          }}
        />
      ))}
    </div>
  );
});

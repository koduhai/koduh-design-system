import { forwardRef, useState } from 'react';
import type {
  FocusEvent,
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode,
  SyntheticEvent,
} from 'react';
import { Chip } from '../Chip';
import { useControllableState, useId } from '../../primitives';
import { useOptionalFieldContext } from '../FormField';
import { cx } from '../../utils/cx';
import styles from './TagInput.module.css';

export type TagInputSize = 'sm' | 'md';

export interface TagInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'size'
> {
  /** Provide `label`, or wrap the control in a `<FormField>` which supplies it. */
  label?: ReactNode;
  value?: string[];
  defaultValue?: string[];
  /** Fires with the next tags array and, where available, the originating event. */
  onChange?: (tags: string[], event?: SyntheticEvent) => void;
  placeholder?: string;
  /** Cap the number of tags. */
  max?: number;
  /** Allow duplicate tags. Defaults to false. */
  allowDuplicates?: boolean;
  size?: TagInputSize;
  required?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  errorText?: ReactNode;
  id?: string;
  className?: string;
}

export const TagInput = /* @__PURE__ */ forwardRef<HTMLInputElement, TagInputProps>(
  function TagInput(
    {
      label,
      value,
      defaultValue,
      onChange,
      placeholder,
      max,
      allowDuplicates = false,
      size = 'md',
      required,
      error = false,
      helperText,
      errorText,
      id: idProp,
      className,
      onBlur,
      onFocus,
      ...rest
    },
    ref,
  ) {
    const reactId = useId('taginput');
    const field = useOptionalFieldContext();
    const id = field?.id ?? idProp ?? reactId;
    const descriptionId = `${id}-description`;
    const description = error ? errorText : helperText;
    const describedBy = field
      ? field.describedById
      : description != null
        ? descriptionId
        : undefined;
    const invalid = field ? field.invalid : error;
    const isRequired = field ? field.required : required;
    const showOwnLabel = !field;
    const [tags, setTags] = useControllableState<string[]>({
      value,
      defaultValue: defaultValue ?? [],
    });
    const [draft, setDraft] = useState('');

    const addTag = (raw: string, event?: SyntheticEvent) => {
      const t = raw.trim();
      if (!t) return;
      if (!allowDuplicates && tags.includes(t)) return;
      if (max != null && tags.length >= max) return;
      const next = [...tags, t];
      setTags(next);
      onChange?.(next, event);
    };
    const removeAt = (i: number, event?: SyntheticEvent) => {
      const next = tags.filter((_, idx) => idx !== i);
      setTags(next);
      onChange?.(next, event);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(draft, e);
        setDraft('');
      } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
        removeAt(tags.length - 1, e);
      }
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      if (draft.trim()) {
        addTag(draft, e);
        setDraft('');
      }
      onBlur?.(e);
    };

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
        <div className={styles.field}>
          {tags.map((tag, i) => (
            <Chip key={`${tag}-${i}`} label={tag} size="sm" onDelete={() => removeAt(i)} />
          ))}
          <input
            {...rest}
            ref={ref}
            id={id}
            className={styles.input}
            value={draft}
            placeholder={placeholder}
            required={isRequired && tags.length === 0}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={handleBlur}
          />
        </div>
        {showOwnLabel && description != null ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);

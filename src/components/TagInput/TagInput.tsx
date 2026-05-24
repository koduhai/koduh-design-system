import { forwardRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Chip } from '../Chip';
import { useControllableState, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import styles from './TagInput.module.css';

export type TagInputSize = 'sm' | 'md';

export interface TagInputProps {
  label: ReactNode;
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
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
    },
    ref,
  ) {
    const reactId = useId('taginput');
    const id = idProp ?? reactId;
    const descriptionId = `${id}-description`;
    const description = error ? errorText : helperText;
    const [tags, setTags] = useControllableState<string[]>({
      value,
      defaultValue: defaultValue ?? [],
      onChange,
    });
    const [draft, setDraft] = useState('');

    const addTag = (raw: string) => {
      const t = raw.trim();
      if (!t) return;
      if (!allowDuplicates && tags.includes(t)) return;
      if (max != null && tags.length >= max) return;
      setTags([...tags, t]);
    };
    const removeAt = (i: number) => setTags(tags.filter((_, idx) => idx !== i));

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(draft);
        setDraft('');
      } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
        removeAt(tags.length - 1);
      }
    };

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
        <div className={styles.field}>
          {tags.map((tag, i) => (
            <Chip key={`${tag}-${i}`} label={tag} size="sm" onDelete={() => removeAt(i)} />
          ))}
          <input
            ref={ref}
            id={id}
            className={styles.input}
            value={draft}
            placeholder={placeholder}
            required={required && tags.length === 0}
            aria-invalid={error || undefined}
            aria-describedby={description != null ? descriptionId : undefined}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (draft.trim()) {
                addTag(draft);
                setDraft('');
              }
            }}
          />
        </div>
        {description != null ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);

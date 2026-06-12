import { forwardRef, useRef, useState } from 'react';
import type { DragEvent, HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useId, mergeRefs } from '../../primitives';
import { cx } from '../../utils/cx';
import { useMessages } from '../../i18n';
import { useOptionalFieldContext } from '../FormField';
import styles from './FileUpload.module.css';

export interface FileUploadProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onDrop' | 'onDragOver' | 'onDragEnter' | 'onDragLeave'
> {
  /** Fires with the dropped or selected files. */
  onFiles: (files: File[]) => void;
  /** Native input `accept` (e.g. 'image/*,.pdf'). */
  accept?: string;
  /** Allow selecting/dropping more than one file. Defaults to false. */
  multiple?: boolean;
  /** Disables interaction. */
  disabled?: boolean;
  /** Primary prompt shown in the dropzone. Defaults to a sensible string. */
  label?: ReactNode;
  /** Base id for the input; derives the instructions id. */
  id?: string;
}

export const FileUpload = /* @__PURE__ */ forwardRef<HTMLInputElement, FileUploadProps>(
  function FileUpload(
    { onFiles, accept, multiple = false, disabled = false, label, className, id: idProp, ...props },
    ref,
  ) {
    const reactId = useId('fileupload');
    const messages = useMessages();
    const field = useOptionalFieldContext();
    // When inside a <FormField>, defer id/aria to it; otherwise use own props.
    // The operable wrapper (role="button") is the perceived control, so it carries
    // the field id and association; the hidden <input> gets its own derived id.
    const id = field?.id ?? idProp ?? reactId;
    const inputId = `${id}-input`;
    const instructionsId = `${id}-instructions`;
    const describedBy = field?.describedById
      ? `${field.describedById} ${instructionsId}`
      : instructionsId;
    const isRequired = field?.required;

    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dragover, setDragover] = useState(false);

    const emit = (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFiles(Array.from(fileList));
    };

    const openPicker = () => {
      if (disabled) return;
      inputRef.current?.click();
    };

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
      // Ignore the click the native <input> dispatches when we programmatically
      // open it (it bubbles back to this handler and would re-open the picker).
      if (event.target === inputRef.current) return;
      openPicker();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        openPicker();
      }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
      // Always preventDefault so the browser never tries to navigate to / open
      // the file, even on a disabled dropzone; only the visual state is gated.
      event.preventDefault();
      if (disabled) return;
      if (!dragover) setDragover(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      // Only clear when leaving the dropzone itself, not a descendant.
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      setDragover(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
      // preventDefault unconditionally so a drop on a disabled dropzone does not
      // navigate to / open the dropped file; emitting is gated on disabled.
      event.preventDefault();
      if (disabled) return;
      setDragover(false);
      emit(event.dataTransfer?.files ?? null);
    };

    const labelText =
      label ??
      (multiple ? 'Drag files here or click to browse' : 'Drag a file here or click to browse');

    return (
      <div
        role="button"
        id={id}
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        // The operable wrapper carries the field association: a <label htmlFor>
        // cannot target a role="button", so reference the FormField label by id.
        aria-labelledby={field?.labelId}
        aria-describedby={describedBy}
        // No aria-invalid / aria-required here: neither is a valid ARIA attribute
        // on role="button" (axe aria-allowed-attr). Required is enforced natively
        // on the file input below; the error text is conveyed via aria-describedby.
        className={cx(styles.root, className)}
        data-dragover={dragover ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        // aria-invalid is not allowed on role="button" (axe), so the error state
        // is surfaced for styling via data-invalid driven by the field's validity.
        data-invalid={field?.invalid ? 'true' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...props}
      >
        <span className={styles.label}>
          {labelText}
          {isRequired ? (
            <span className={styles.required} aria-hidden>
              {' '}
              *
            </span>
          ) : null}
        </span>
        <span id={instructionsId} className={styles.instructions}>
          {multiple ? messages.fileUpload.multipleFiles : messages.fileUpload.singleFile}
          {accept ? ` ${messages.fileUpload.accepted(accept)}` : ''}
        </span>
        <input
          ref={mergeRefs(inputRef, ref)}
          id={inputId}
          type="file"
          // No aria-label: the input is display:none (see FileUpload.module.css),
          // so it is not in the accessibility tree. The role="button" wrapper is the
          // named, operable control. axe ignores display:none elements, so the input
          // does not need its own label.
          className={styles.input}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          required={isRequired}
          tabIndex={-1}
          onChange={(event) => {
            emit(event.target.files);
            // Reset so selecting the same file again re-fires change.
            event.target.value = '';
          }}
        />
      </div>
    );
  },
);

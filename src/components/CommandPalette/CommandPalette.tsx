import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { mergeRefs, useId } from '../../primitives';
import { cx } from '../../utils/cx';
import { SearchIcon } from '../../icons';
import styles from './CommandPalette.module.css';

export interface CommandPaletteCommand {
  /** Stable identity for the command. */
  id: string;
  /** Visible label, also matched against the query. */
  label: string;
  /** Optional group heading the command is listed under. */
  group?: string;
  /** Extra text matched against the query (synonyms, shortcuts). */
  keywords?: string;
  /** Invoked when the command is chosen. The palette closes afterwards. */
  onSelect: () => void;
}

export interface CommandPaletteProps extends Omit<HTMLAttributes<HTMLDialogElement>, 'title'> {
  /** Whether the palette is shown modally. */
  open: boolean;
  /**
   * Called with the requested next open state. Fires with `false` on Esc,
   * backdrop click, or after a command runs. Matches the Dialog overlay API.
   */
  onOpenChange: (open: boolean) => void;
  /** The available commands. */
  commands: CommandPaletteCommand[];
  /** Search input placeholder. Defaults to 'Type a command or search…'. */
  placeholder?: string;
  /** Shown when no command matches. Defaults to 'No results'. */
  noResultsText?: string;
  /** Accessible label for the search input. Defaults to 'Command menu'. */
  'aria-label'?: string;
}

const matches = (command: CommandPaletteCommand, query: string) => {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return (
    command.label.toLowerCase().includes(q) ||
    (command.keywords?.toLowerCase().includes(q) ?? false)
  );
};

/** `ref` forwards to the underlying native `<dialog>`. */
export const CommandPalette = /* @__PURE__ */ forwardRef<HTMLDialogElement, CommandPaletteProps>(
  function CommandPalette(
    {
      open,
      onOpenChange,
      commands,
      placeholder = 'Type a command or search…',
      noResultsText = 'No results',
      'aria-label': ariaLabel = 'Command menu',
      className,
      ...props
    },
    forwardedRef,
  ) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const baseId = useId('command-palette');
    const listboxId = `${baseId}-listbox`;
    const inputId = `${baseId}-input`;
    const optionId = (id: string) => `${baseId}-opt-${id}`;

    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const close = useCallback(() => onOpenChange(false), [onOpenChange]);

    const filtered = useMemo(() => commands.filter((c) => matches(c, query)), [commands, query]);

    // Group while preserving first-seen order; ungrouped commands sit under ''.
    const groups = useMemo(() => {
      const order: string[] = [];
      const byGroup = new Map<string, CommandPaletteCommand[]>();
      for (const command of filtered) {
        const key = command.group ?? '';
        let bucket = byGroup.get(key);
        if (!bucket) {
          bucket = [];
          byGroup.set(key, bucket);
          order.push(key);
        }
        bucket.push(command);
      }
      // Flat, ordered list mirrors visual order so index math stays simple.
      const flat: CommandPaletteCommand[] = [];
      for (const key of order) flat.push(...(byGroup.get(key) ?? []));
      return { order, byGroup, flat };
    }, [filtered]);

    const flatCommands = groups.flat;
    const activeCommand = flatCommands[activeIndex];

    // Sync the React `open` prop to native showModal()/close(), guarding both
    // directions so we never hit InvalidStateError ("already open").
    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (open && !dialog.open) {
        dialog.showModal();
      } else if (!open && dialog.open) {
        dialog.close();
      }
    }, [open]);

    // Reset query/active selection each time the palette opens.
    useEffect(() => {
      if (open) {
        setQuery('');
        setActiveIndex(0);
      }
    }, [open]);

    // Keep the active index in range as the filtered set shrinks.
    useEffect(() => {
      setActiveIndex((i) => {
        if (flatCommands.length === 0) return 0;
        return Math.min(i, flatCommands.length - 1);
      });
    }, [flatCommands.length]);

    // Wire native close/cancel (browser fires these on Esc) to onOpenChange.
    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const handleClose = () => close();
      dialog.addEventListener('close', handleClose);
      return () => dialog.removeEventListener('close', handleClose);
    }, [close]);

    const runCommand = (command: CommandPaletteCommand | undefined) => {
      if (!command) return;
      command.onSelect();
      close();
    };

    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((i) => (flatCommands.length === 0 ? 0 : (i + 1) % flatCommands.length));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex((i) =>
            flatCommands.length === 0 ? 0 : (i - 1 + flatCommands.length) % flatCommands.length,
          );
          break;
        case 'Enter':
          event.preventDefault();
          runCommand(activeCommand);
          break;
        case 'Escape':
          event.preventDefault();
          close();
          break;
        default:
          break;
      }
    };

    const handleBackdropClick = useCallback(
      (event: React.MouseEvent<HTMLDialogElement>) => {
        if (event.target === dialogRef.current) {
          close();
        }
      },
      [close],
    );

    return (
      <dialog
        ref={mergeRefs(dialogRef, forwardedRef)}
        className={cx(styles.root, className)}
        onClick={handleBackdropClick}
        {...props}
      >
        <div className={styles.surface}>
          <div className={styles.searchRow}>
            <SearchIcon className={styles.searchIcon} aria-hidden />
            <input
              id={inputId}
              type="text"
              role="combobox"
              className={styles.input}
              placeholder={placeholder}
              aria-label={ariaLabel}
              aria-expanded
              aria-controls={listboxId}
              aria-activedescendant={activeCommand ? optionId(activeCommand.id) : undefined}
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
            />
          </div>

          <ul id={listboxId} role="listbox" aria-label={ariaLabel} className={styles.listbox}>
            {flatCommands.length === 0 ? (
              <li className={styles.noResults} role="presentation">
                {noResultsText}
              </li>
            ) : (
              groups.order.map((groupKey) => {
                const bucket = groups.byGroup.get(groupKey) ?? [];
                return (
                  <li key={groupKey || '__ungrouped'} role="presentation">
                    {groupKey ? (
                      <div className={styles.groupHeading} role="presentation">
                        {groupKey}
                      </div>
                    ) : null}
                    <ul role="presentation" className={styles.groupList}>
                      {bucket.map((command) => {
                        const index = flatCommands.indexOf(command);
                        const isActive = index === activeIndex;
                        return (
                          <li
                            key={command.id}
                            id={optionId(command.id)}
                            role="option"
                            aria-selected={isActive}
                            data-active={isActive ? 'true' : undefined}
                            className={styles.option}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => runCommand(command)}
                          >
                            {command.label}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </dialog>
    );
  },
);

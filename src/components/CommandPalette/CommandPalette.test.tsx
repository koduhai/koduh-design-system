import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from './CommandPalette';

beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  }
});

const commands = [
  { id: 'new', label: 'New document', group: 'Actions', keywords: 'create', onSelect: vi.fn() },
  { id: 'open', label: 'Open file', group: 'Actions', onSelect: vi.fn() },
  {
    id: 'settings',
    label: 'Open settings',
    group: 'Navigation',
    keywords: 'preferences',
    onSelect: vi.fn(),
  },
];

describe('CommandPalette', () => {
  it('is not shown when open is false', () => {
    render(<CommandPalette open={false} onOpenChange={() => {}} commands={commands} />);
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    expect(dlg.open).toBe(false);
  });

  it('shows a combobox input and a listbox of options when open', () => {
    render(<CommandPalette open onOpenChange={() => {}} commands={commands} />);
    expect(screen.getByRole('combobox', { name: 'Command menu' })).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('renders group headings', () => {
    render(<CommandPalette open onOpenChange={() => {}} commands={commands} />);
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('filters by label and keywords, case-insensitively', async () => {
    render(<CommandPalette open onOpenChange={() => {}} commands={commands} />);
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'PREFERENCES');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Open settings');
  });

  it('shows the no-results message when nothing matches', async () => {
    render(<CommandPalette open onOpenChange={() => {}} commands={commands} />);
    await userEvent.type(screen.getByRole('combobox'), 'zzzzz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('moves the active option with ArrowDown/ArrowUp via aria-activedescendant', async () => {
    render(<CommandPalette open onOpenChange={() => {}} commands={commands} />);
    const input = screen.getByRole('combobox');
    const options = screen.getAllByRole('option');
    // First option is active by default.
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]!.id);
    await userEvent.type(input, '{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1]!.id);
    await userEvent.type(input, '{ArrowUp}');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]!.id);
  });

  it('runs the active command on Enter, then closes', async () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open onOpenChange={onOpenChange} commands={commands} />);
    const input = screen.getByRole('combobox');
    await userEvent.type(input, '{ArrowDown}{Enter}');
    expect(commands[1]!.onSelect).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('runs a command on click', async () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open
        onOpenChange={onOpenChange}
        commands={[{ id: 'x', label: 'Run it', onSelect }]}
      />,
    );
    await userEvent.click(screen.getByRole('option', { name: 'Run it' }));
    expect(onSelect).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes via the native close event (Esc/cancel)', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open onOpenChange={onOpenChange} commands={commands} />);
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    dlg.dispatchEvent(new Event('close'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on Escape from the input', async () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open onOpenChange={onOpenChange} commands={commands} />);
    await userEvent.type(screen.getByRole('combobox'), '{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('forwards ref to the underlying dialog', () => {
    const ref = { current: null as HTMLDialogElement | null };
    render(<CommandPalette ref={ref} open={false} onOpenChange={() => {}} commands={commands} />);
    expect(ref.current).toBeInstanceOf(HTMLDialogElement);
  });
});

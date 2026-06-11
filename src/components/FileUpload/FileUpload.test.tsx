import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from './FileUpload';
import { FormField } from '../FormField';

function makeFile(name: string, type = 'text/plain') {
  return new File(['hello'], name, { type });
}

describe('FileUpload', () => {
  it('renders a focusable button-semantic dropzone wrapping a file input', () => {
    render(<FileUpload onFiles={() => {}} />);
    const zone = screen.getByRole('button');
    expect(zone).toHaveAttribute('tabindex', '0');
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });

  it('opens the picker on click and calls onFiles on selection', async () => {
    const onFiles = vi.fn();
    render(<FileUpload onFiles={onFiles} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    await userEvent.click(screen.getByRole('button'));
    expect(clickSpy).toHaveBeenCalled();

    await userEvent.upload(input, makeFile('a.txt'));
    expect(onFiles).toHaveBeenCalledTimes(1);
    const files = onFiles.mock.calls[0]?.[0] ?? [];
    expect(files[0]?.name).toBe('a.txt');
  });

  it('opens the picker on Enter and Space', async () => {
    render(<FileUpload onFiles={() => {}} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    const zone = screen.getByRole('button');

    zone.focus();
    fireEvent.keyDown(zone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(zone, { key: ' ' });
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it('sets data-dragover on drag over and clears it on drop, emitting files', () => {
    const onFiles = vi.fn();
    render(<FileUpload multiple onFiles={onFiles} />);
    const zone = screen.getByRole('button');

    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute('data-dragover', 'true');

    const files = [makeFile('a.txt'), makeFile('b.txt')];
    fireEvent.drop(zone, { dataTransfer: { files } });
    expect(zone).not.toHaveAttribute('data-dragover');
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it('does nothing when disabled', async () => {
    const onFiles = vi.fn();
    render(<FileUpload disabled onFiles={onFiles} />);
    const zone = screen.getByRole('button');
    expect(zone).toHaveAttribute('aria-disabled', 'true');
    expect(zone).toHaveAttribute('tabindex', '-1');

    fireEvent.dragOver(zone);
    expect(zone).not.toHaveAttribute('data-dragover');
    fireEvent.drop(zone, { dataTransfer: { files: [makeFile('a.txt')] } });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('preventDefaults dragover and drop even when disabled (no browser navigation)', () => {
    render(<FileUpload disabled onFiles={() => {}} />);
    const zone = screen.getByRole('button');

    const dragEvent = new Event('dragover', { bubbles: true, cancelable: true });
    Object.defineProperty(dragEvent, 'dataTransfer', { value: { files: [] } });
    zone.dispatchEvent(dragEvent);
    expect(dragEvent.defaultPrevented).toBe(true);

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [makeFile('a.txt')] },
    });
    zone.dispatchEvent(dropEvent);
    expect(dropEvent.defaultPrevented).toBe(true);
  });

  it('forwards accept and multiple to the native input', () => {
    render(<FileUpload multiple accept="image/*" onFiles={() => {}} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input.multiple).toBe(true);
  });

  it('forwards a ref to the file input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<FileUpload ref={ref} onFiles={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('file');
  });

  it('passes DOM props through to the root', () => {
    render(<FileUpload onFiles={() => {}} data-testid="zone" aria-label="Upload" />);
    const zone = screen.getByTestId('zone');
    expect(zone).toHaveAttribute('aria-label', 'Upload');
  });

  it('composes with FormField, wiring the field association onto the operable wrapper', () => {
    render(
      <FormField label="Attachment" required helperText="PDF only">
        <FileUpload onFiles={() => {}} />
      </FormField>,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const zone = screen.getByRole('button');
    // The FormField <label htmlFor> targets the operable wrapper (the field id),
    // not the hidden input, so the label's accessible name reaches the button.
    const label = screen.getByText('Attachment').closest('label');
    expect(label).toHaveAttribute('for', zone.id);
    expect(zone).toHaveAttribute('aria-labelledby', `${zone.id}-label`);
    // required is exposed on the wrapper via aria-required, and natively on the input.
    expect(zone).toHaveAttribute('aria-required', 'true');
    expect(input.required).toBe(true);
    // The hidden input does not own the field id.
    expect(input.id).not.toBe(zone.id);
    // describedby references the FormField description plus the instructions.
    expect(zone.getAttribute('aria-describedby')).toContain(`${zone.id}-instructions`);
  });

  it('does not put an aria-label on the display:none input (the wrapper is the named control)', () => {
    render(<FileUpload onFiles={() => {}} label="Attach a file" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // The input is display:none, so it is not in the a11y tree and must not carry
    // a dead aria-label. The operable role="button" wrapper is the perceived control.
    expect(input).not.toHaveAttribute('aria-label');
  });

  it('marks the wrapper aria-invalid when the FormField is in error', () => {
    render(
      <FormField label="Attachment" error errorText="Required">
        <FileUpload onFiles={() => {}} />
      </FormField>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-invalid', 'true');
  });
});

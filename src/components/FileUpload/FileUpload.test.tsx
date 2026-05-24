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

  it('composes with FormField for id/aria wiring', () => {
    render(
      <FormField label="Attachment" required helperText="PDF only">
        <FileUpload onFiles={() => {}} />
      </FormField>,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const zone = screen.getByRole('button');
    // The FormField label is associated via the shared id.
    const label = screen.getByText('Attachment').closest('label');
    expect(label).toHaveAttribute('for', input.id);
    expect(input.required).toBe(true);
    // describedby references the FormField description plus the instructions.
    expect(zone.getAttribute('aria-describedby')).toContain(`${input.id}-instructions`);
  });
});

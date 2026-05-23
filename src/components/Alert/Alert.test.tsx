import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders the body and reflects severity as a data attribute', () => {
    render(<Alert severity="info">Heads up</Alert>);
    const el = screen.getByText('Heads up').closest('[data-severity]')!;
    expect(el).toHaveAttribute('data-severity', 'info');
  });

  it('renders the optional title', () => {
    render(
      <Alert severity="success" title="Saved">
        Your changes were saved.
      </Alert>,
    );
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes were saved.')).toBeInTheDocument();
  });

  it('uses role="alert" for error and warning', () => {
    const { rerender } = render(<Alert severity="error">boom</Alert>);
    expect(screen.getByRole('alert')).toHaveAttribute('data-severity', 'error');

    rerender(<Alert severity="warning">careful</Alert>);
    expect(screen.getByRole('alert')).toHaveAttribute('data-severity', 'warning');
  });

  it('uses role="status" for info and success', () => {
    const { rerender } = render(<Alert severity="info">fyi</Alert>);
    expect(screen.getByRole('status')).toHaveAttribute('data-severity', 'info');

    rerender(<Alert severity="success">done</Alert>);
    expect(screen.getByRole('status')).toHaveAttribute('data-severity', 'success');
  });

  it('renders a labeled close button that fires onClose when closable', async () => {
    const onClose = vi.fn();
    render(
      <Alert severity="info" closable onClose={onClose}>
        Dismiss me
      </Alert>,
    );
    const btn = screen.getByRole('button', { name: 'Dismiss' });
    await userEvent.click(btn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render a close button by default', () => {
    render(<Alert severity="info">No close</Alert>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a custom icon and disables the icon when falsy', () => {
    const { rerender } = render(
      <Alert severity="info" icon={<span data-testid="custom-icon" />}>
        body
      </Alert>,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();

    rerender(
      <Alert severity="info" icon={null}>
        body
      </Alert>,
    );
    const el = screen.getByText('body').closest('[data-severity]')!;
    // No svg icon is rendered when icon is explicitly disabled.
    expect(el.querySelector('svg')).toBeNull();
  });

  it('forwards a ref to the div element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Alert ref={ref} severity="info">
        x
      </Alert>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes through className and standard div attributes', () => {
    render(
      <Alert severity="info" className="custom" id="alert-1">
        x
      </Alert>,
    );
    const el = screen.getByText('x').closest('[data-severity]')!;
    expect(el).toHaveClass('custom');
    expect(el).toHaveAttribute('id', 'alert-1');
  });
});

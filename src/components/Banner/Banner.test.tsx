import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Banner } from './Banner';

describe('Banner', () => {
  it('renders the message and reflects severity as a data attribute', () => {
    render(<Banner severity="warning">Heads up</Banner>);
    const el = screen.getByText('Heads up').closest('[data-severity]')!;
    expect(el).toHaveAttribute('data-severity', 'warning');
  });
  it('uses role="alert" for error/warning and role="status" otherwise', () => {
    const { rerender } = render(<Banner severity="error">x</Banner>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<Banner severity="info">x</Banner>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  it('renders a dismiss button only when dismissable and fires onClose', async () => {
    const onClose = vi.fn();
    render(
      <Banner severity="info" dismissable onClose={onClose}>
        x
      </Banner>,
    );
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('renders a title and an action slot', () => {
    render(
      <Banner severity="info" title="T" action={<a href="#a">Act</a>}>
        x
      </Banner>,
    );
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Act' })).toBeInTheDocument();
  });
  it('hides the icon when icon={null}', () => {
    const { container } = render(
      <Banner severity="info" icon={null}>
        x
      </Banner>,
    );
    expect(container.querySelector('[data-banner-icon]')).toBeNull();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KoduhI18nProvider } from '../../i18n';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders a labelled navigation landmark', () => {
    render(<Pagination count={5} page={1} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination count={5} page={3} />);
    const current = screen.getByRole('button', { name: 'Go to page 3' });
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange with the clicked page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination count={5} page={1} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = render(<Pagination count={5} page={1} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    rerender(<Pagination count={5} page={5} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('prev/next move by one page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination count={5} page={3} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('does not fire when clicking the current page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination count={5} page={3} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('disables every button when the disabled prop is set', () => {
    render(<Pagination count={5} page={3} disabled />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.every((btn) => btn.hasAttribute('disabled'))).toBe(true);
  });

  it('allows overriding the navigation aria-label', () => {
    render(<Pagination count={5} page={1} aria-label="Article pages" />);
    expect(screen.getByRole('navigation', { name: 'Article pages' })).toBeInTheDocument();
  });

  it('allows overriding the Previous/Next control labels', () => {
    render(<Pagination count={5} page={3} previousLabel="Vorige" nextLabel="Volgende" />);
    expect(screen.getByRole('button', { name: 'Vorige' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volgende' })).toBeInTheDocument();
  });

  it('formats every control label via getItemAriaLabel', () => {
    const getItemAriaLabel = (type: string, target: number) =>
      type === 'page' ? `Pagina ${target}` : type === 'previous' ? 'Vorige' : 'Volgende';
    render(<Pagination count={5} page={3} getItemAriaLabel={getItemAriaLabel} />);
    expect(screen.getByRole('button', { name: 'Pagina 3' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Vorige' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volgende' })).toBeInTheDocument();
  });

  it('renders ellipses as inert, non-button nodes', () => {
    render(<Pagination count={20} page={10} />);
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
    // ellipsis is not a button
    expect(screen.queryByRole('button', { name: '…' })).toBeNull();
  });

  it('uses the i18n catalog defaults with no provider', () => {
    render(<Pagination count={5} page={2} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
  });

  it('routes every built-in label through a KoduhI18nProvider override', () => {
    render(
      <KoduhI18nProvider
        messages={{
          pagination: {
            label: 'Paginering',
            previous: 'Vorige',
            next: 'Volgende',
            page: (n) => `Pagina ${n}`,
            current: (n) => `Pagina ${n}, huidige pagina`,
          },
        }}
      >
        <Pagination count={5} page={2} />
      </KoduhI18nProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Paginering' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vorige' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volgende' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagina 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagina 2, huidige pagina' })).toBeInTheDocument();
  });

  it('lets the previousLabel/nextLabel props override the provider', () => {
    render(
      <KoduhI18nProvider messages={{ pagination: { previous: 'Vorige', next: 'Volgende' } }}>
        <Pagination count={5} page={3} previousLabel="Fixed prev" nextLabel="Fixed next" />
      </KoduhI18nProvider>,
    );
    expect(screen.getByRole('button', { name: 'Fixed prev' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fixed next' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vorige' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Volgende' })).toBeNull();
  });

  it('lets the aria-label prop override the provider nav label', () => {
    render(
      <KoduhI18nProvider messages={{ pagination: { label: 'Paginering' } }}>
        <Pagination count={5} page={1} aria-label="Article pages" />
      </KoduhI18nProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Article pages' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Paginering' })).toBeNull();
  });
});

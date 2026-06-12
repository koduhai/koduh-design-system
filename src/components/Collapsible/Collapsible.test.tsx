import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
  it('renders a trigger button wired to the panel and is closed by default', () => {
    render(
      <Collapsible trigger="Details">
        <p>Panel body</p>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const panelId = trigger.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId!);
    expect(panel).toHaveAttribute('hidden');
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
  });

  it('opens with defaultOpen and shows the content region', () => {
    render(
      <Collapsible trigger="Details" defaultOpen>
        <p>Panel body</p>
      </Collapsible>,
    );
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByText('Panel body')).toBeVisible();
  });

  it('toggles open/closed on click (uncontrolled)', async () => {
    render(
      <Collapsible trigger="Details">
        <p>Panel body</p>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('controlled: respects open and fires onOpenChange without self-updating', async () => {
    const onOpenChange = vi.fn();
    render(
      <Collapsible trigger="Details" open={false} onOpenChange={onOpenChange}>
        <p>Panel body</p>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    await userEvent.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false'); // controlled, no internal change
  });

  it('does not toggle when disabled', async () => {
    const onOpenChange = vi.fn();
    render(
      <Collapsible trigger="Details" disabled onOpenChange={onOpenChange}>
        <p>Panel body</p>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('forwards ref and DOM props to the root', () => {
    const ref = vi.fn();
    render(
      <Collapsible trigger="Details" ref={ref} data-testid="cz">
        <p>Body</p>
      </Collapsible>,
    );
    expect(screen.getByTestId('cz')).toBeInTheDocument();
    expect(ref).toHaveBeenCalled();
  });
});

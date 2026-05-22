import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KoduhThemeProvider } from './KoduhThemeProvider';
import { useColorMode } from './useColorMode';

function ModeProbe() {
  const { mode, toggleMode } = useColorMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button onClick={toggleMode}>toggle</button>
    </div>
  );
}

describe('KoduhThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to dark and sets data-theme on the document element', () => {
    render(
      <KoduhThemeProvider>
        <ModeProbe />
      </KoduhThemeProvider>,
    );
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('honors an explicit defaultMode', () => {
    render(
      <KoduhThemeProvider defaultMode="light">
        <ModeProbe />
      </KoduhThemeProvider>,
    );
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('toggles and persists the mode to localStorage', async () => {
    render(
      <KoduhThemeProvider>
        <ModeProbe />
      </KoduhThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(window.localStorage.getItem('koduh-color-mode')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('restores a persisted mode on mount', () => {
    window.localStorage.setItem('koduh-color-mode', 'light');
    render(
      <KoduhThemeProvider defaultMode="dark">
        <ModeProbe />
      </KoduhThemeProvider>,
    );
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('throws when useColorMode is used outside the provider', () => {
    const Broken = () => {
      useColorMode();
      return null;
    };
    expect(() => render(<Broken />)).toThrow(/useColorMode/);
  });
});

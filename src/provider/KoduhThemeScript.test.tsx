import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { KoduhThemeScript } from './KoduhThemeScript';

const DEFAULT_KEY = 'koduh-color-mode';

/**
 * Render the script component and return the inline script body. The component
 * emits exactly one `<script>` whose content lives in `innerHTML`.
 */
function renderScriptBody(props?: Parameters<typeof KoduhThemeScript>[0]): {
  el: HTMLScriptElement;
  body: string;
} {
  const { container } = render(<KoduhThemeScript {...props} />);
  const el = container.querySelector('script');
  if (!el) throw new Error('expected a <script> element');
  return { el, body: el.innerHTML };
}

/**
 * Execute a generated script body in jsdom and return the resulting
 * `data-theme` value. The body is a self-invoking IIFE that mutates
 * `document.documentElement`, so running it via `Function` reproduces what the
 * browser does at parse time.
 */
function runScript(body: string): string | null {
  document.documentElement.removeAttribute('data-theme');
  new Function(body)();
  return document.documentElement.getAttribute('data-theme');
}

/** Install a matchMedia mock that reports the given OS dark-scheme preference. */
function mockMatchMedia(prefersDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: prefersDark }),
  });
}

describe('KoduhThemeScript', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendered script string', () => {
    it('contains the default storageKey and the data-theme logic', () => {
      const { body } = renderScriptBody();
      expect(body).toContain(JSON.stringify(DEFAULT_KEY));
      expect(body).toContain("setAttribute('data-theme'");
      expect(body).toContain('prefers-color-scheme: dark');
      expect(body).toContain('localStorage.getItem');
    });

    it('injects a custom storageKey as a JSON literal', () => {
      const { body } = renderScriptBody({ storageKey: 'my-theme' });
      expect(body).toContain(JSON.stringify('my-theme'));
      expect(body).not.toContain(JSON.stringify(DEFAULT_KEY));
    });

    it('contains no em-dashes', () => {
      const { body } = renderScriptBody();
      expect(body).not.toContain('—');
    });

    it('forwards the nonce prop to the rendered <script>', () => {
      const { el } = renderScriptBody({ nonce: 'abc123' });
      expect(el.getAttribute('nonce')).toBe('abc123');
    });

    it('omits the nonce attribute when not provided', () => {
      const { el } = renderScriptBody();
      expect(el.hasAttribute('nonce')).toBe(false);
    });
  });

  describe('executing the generated IIFE', () => {
    it("stored 'light' resolves to light", () => {
      window.localStorage.setItem(DEFAULT_KEY, 'light');
      const { body } = renderScriptBody();
      expect(runScript(body)).toBe('light');
    });

    it("stored 'dark' resolves to dark", () => {
      window.localStorage.setItem(DEFAULT_KEY, 'dark');
      const { body } = renderScriptBody();
      expect(runScript(body)).toBe('dark');
    });

    it("stored 'system' with OS dark resolves to dark", () => {
      window.localStorage.setItem(DEFAULT_KEY, 'system');
      mockMatchMedia(true);
      const { body } = renderScriptBody();
      expect(runScript(body)).toBe('dark');
    });

    it("stored 'system' with OS light resolves to light", () => {
      window.localStorage.setItem(DEFAULT_KEY, 'system');
      mockMatchMedia(false);
      const { body } = renderScriptBody();
      expect(runScript(body)).toBe('light');
    });

    it('no stored value falls back to defaultMode', () => {
      const { body } = renderScriptBody({ defaultMode: 'light' });
      expect(runScript(body)).toBe('light');
    });

    it('invalid stored value falls back to defaultMode', () => {
      window.localStorage.setItem(DEFAULT_KEY, 'purple');
      const { body } = renderScriptBody({ defaultMode: 'light' });
      expect(runScript(body)).toBe('light');
    });

    it('localStorage getItem throwing falls back to defaultMode without crashing', () => {
      const spy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      const { body } = renderScriptBody({ defaultMode: 'dark' });
      expect(() => runScript(body)).not.toThrow();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      spy.mockRestore();
    });

    it('honors a custom storageKey + custom defaultMode', () => {
      window.localStorage.setItem('my-theme', 'light');
      const { body } = renderScriptBody({ storageKey: 'my-theme', defaultMode: 'dark' });
      expect(runScript(body)).toBe('light');
    });

    it("defaultMode='system' with no stored value resolves via matchMedia", () => {
      mockMatchMedia(false);
      const { body } = renderScriptBody({ defaultMode: 'system' });
      expect(runScript(body)).toBe('light');
    });

    it("defaultMode='system' falls back to dark when matchMedia is unavailable", () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: undefined,
      });
      const { body } = renderScriptBody({ defaultMode: 'system' });
      expect(runScript(body)).toBe('dark');
    });
  });
});

import type { ColorMode, ColorScheme } from '../theme/tokens';

export interface KoduhThemeScriptProps {
  /**
   * localStorage key to read the persisted preference from. Must match the
   * `storageKey` passed to {@link KoduhThemeProvider} (both default to
   * `'koduh-color-mode'`).
   */
  storageKey?: string;
  /**
   * Theme to use when nothing is persisted. Accepts `'system'` to follow the OS
   * `prefers-color-scheme`. Must match the provider's `defaultMode`. Defaults to
   * `'dark'`.
   */
  defaultMode?: ColorScheme;
  /**
   * CSP nonce, forwarded to the rendered `<script nonce>` so the inline script is
   * allowed under a strict Content-Security-Policy.
   */
  nonce?: string;
}

/**
 * Build the inline no-flash script body. The result is an ES5-safe IIFE (no
 * optional chaining, arrow functions, or template literals) so it runs as-is in
 * any browser the moment the document parses it. `storageKey`/`defaultMode` are
 * injected as JSON-encoded literals; the resolved concrete mode is written to
 * `document.documentElement` before first paint, mirroring KoduhThemeProvider.
 */
function buildScript(storageKey: string, defaultMode: ColorScheme): string {
  const key = JSON.stringify(storageKey);
  const fallback: ColorMode = 'dark';
  // Mirror the provider exactly: a stored value is honored only if it is one of
  // 'dark' | 'light' | 'system'; otherwise we fall back to defaultMode. For
  // 'system' we read matchMedia, defaulting to 'dark' when it is unavailable.
  // localStorage access can throw (sandboxed iframes / privacy policies), so the
  // read is wrapped in try/catch and falls back silently.
  return (
    '(function(){' +
    'try{' +
    'var d=document.documentElement;' +
    'var pref=' +
    JSON.stringify(defaultMode) +
    ';' +
    'try{' +
    'var stored=window.localStorage.getItem(' +
    key +
    ');' +
    "if(stored==='dark'||stored==='light'||stored==='system'){pref=stored;}" +
    '}catch(e){}' +
    'var mode=pref;' +
    "if(pref==='system'){" +
    'mode=' +
    JSON.stringify(fallback) +
    ';' +
    "if(typeof window.matchMedia==='function'){" +
    "mode=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';" +
    '}' +
    '}' +
    "d.setAttribute('data-theme',mode);" +
    '}catch(e){}' +
    '})();'
  );
}

/**
 * Synchronous no-flash theme script for SSR (Next.js, Remix, etc.).
 *
 * `KoduhThemeProvider` only sets `data-theme` inside a `useEffect`, which runs
 * after hydration. On a server-rendered page that causes a flash of the wrong
 * theme on first paint. Render this component in your document `<head>`, before
 * the app, so the persisted preference is applied synchronously before the
 * browser paints. Keep its `storageKey`/`defaultMode` in sync with the provider.
 *
 * @example
 * ```tsx
 * <head>
 *   <KoduhThemeScript />
 * </head>
 * ```
 */
export function KoduhThemeScript({
  storageKey = 'koduh-color-mode',
  defaultMode = 'dark',
  nonce,
}: KoduhThemeScriptProps) {
  return (
    <script
      nonce={nonce}
      // The script body is built from a fixed template plus JSON-encoded literals
      // (no consumer-controlled HTML), so dangerouslySetInnerHTML is safe here and
      // is the only way to emit a synchronous inline script that runs before paint.
      dangerouslySetInnerHTML={{ __html: buildScript(storageKey, defaultMode) }}
    />
  );
}

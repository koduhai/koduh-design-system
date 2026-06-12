# SSR / no-flash theme setup

`KoduhThemeProvider` applies the active theme by setting `data-theme` on
`<html>` inside a `useEffect`. Effects only run **after** hydration, so a
server-rendered page (Next.js, Remix) paints once with the server's markup
before the provider corrects the theme. If the persisted preference differs from
the server default, the user sees a brief flash of the wrong theme.

`KoduhThemeScript` fixes this. It renders a tiny synchronous inline `<script>`
that you place in the document `<head>`, **before** your app. The browser runs it
the moment it parses the `<head>`, so `data-theme` is set from the persisted
preference before first paint. There is no flash.

## How it works

The script reads the same localStorage key the provider writes, resolves the
stored `'dark' | 'light' | 'system'` value (falling back to `defaultMode` for a
missing or invalid value), expands `'system'` via
`matchMedia('(prefers-color-scheme: dark)')`, and writes the concrete
`'dark' | 'light'` result to `document.documentElement`. It is dependency-free
and ES5-safe, and it swallows localStorage errors (sandboxed iframes, privacy
policies) silently, exactly like the provider does.

> **Keep them in sync.** `KoduhThemeScript` and `KoduhThemeProvider` must use the
> same `storageKey` and `defaultMode`. Both default to `storageKey='koduh-color-mode'`
> and `defaultMode='dark'`. If you override either on the provider, pass the same
> values to the script, or they will disagree and the flash returns.

## Next.js (App Router)

Put the script in `<head>` and wrap the app in the provider in
`app/layout.tsx`:

```tsx
// app/layout.tsx
import { KoduhThemeScript, KoduhThemeProvider } from '@koduhai/design-system';
import '@koduhai/design-system/theme.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <KoduhThemeScript />
      </head>
      <body>
        <KoduhThemeProvider>{children}</KoduhThemeProvider>
      </body>
    </html>
  );
}
```

`suppressHydrationWarning` on `<html>` is recommended: the script mutates the
`data-theme` attribute before React hydrates, so without it React may warn about
the server/client attribute mismatch.

## Remix

Render the script inside `<head>` in `app/root.tsx`:

```tsx
// app/root.tsx
import { Outlet, Links, Meta, Scripts, ScrollRestoration } from '@remix-run/react';
import { KoduhThemeScript, KoduhThemeProvider } from '@koduhai/design-system';

export default function App() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Meta />
        <Links />
        <KoduhThemeScript />
      </head>
      <body>
        <KoduhThemeProvider>
          <Outlet />
        </KoduhThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

## CSP (Content-Security-Policy)

The no-flash script is inline, so a strict CSP that disallows
`script-src 'unsafe-inline'` will block it. Pass a per-request `nonce` to allow
just this script:

```tsx
<KoduhThemeScript nonce={nonce} />
```

The `nonce` is forwarded to the rendered `<script nonce>`. Generate it on the
server per request and include the same value in your
`Content-Security-Policy: script-src 'nonce-...'` header. (In Next.js the nonce
is typically produced in middleware and read back from headers.)

## Custom options

```tsx
// Match a non-default provider configuration.
<KoduhThemeScript storageKey="app-theme" defaultMode="system" />
<KoduhThemeProvider storageKey="app-theme" defaultMode="system">
  {children}
</KoduhThemeProvider>
```

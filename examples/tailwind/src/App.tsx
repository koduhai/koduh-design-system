import { useState } from 'react';
import { Button, Card, CardHeader, CardBody, CardFooter } from '@koduhai/design-system';

/**
 * Demonstrates that `@koduhai/design-system` and Tailwind coexist in one app:
 *
 *  (a) Tailwind utilities resolve to the preset's semantic color tokens
 *      (`bg-canvas`, `text-fg`, `bg-surface`, `border-border`, `bg-primary`, …),
 *      so they re-theme with the toggle.
 *  (b) The fixed brand tint ramp (`bg-brand-50` … `bg-brand-900`) renders the
 *      same in both themes (it is theme-independent by design).
 *  (c) A dark/light toggle flips the `.dark`/`.light` class on <html>, which is
 *      what `darkMode: 'class'` and theme.css's class-keyed overrides react to.
 *      (Alternative: wrap the app in <KoduhThemeProvider> and call useColorMode;
 *      that drives the `[data-theme]` attribute instead. Both are supported.)
 *  (d) Real design-system components (<Button>, <Card>) render alongside the
 *      Tailwind-styled markup, proving the CSS Modules don't collide with
 *      Tailwind utilities.
 */

/** Read the current theme from the <html> class so the label stays in sync. */
function getInitialDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

export default function App() {
  const [dark, setDark] = useState(getInitialDark);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    // Tailwind `darkMode: 'class'` + theme.css class overrides. Toggle BOTH so
    // the design system reaches its light palette (its :root is dark by default).
    const el = document.documentElement;
    el.classList.toggle('dark', next);
    el.classList.toggle('light', !next);
  }

  // Full literal class names so Tailwind's content scanner detects them
  // (it does static string analysis; `bg-brand-${step}` would be missed).
  const brandRamp: { step: number; bg: string; fg: string }[] = [
    { step: 50, bg: 'bg-brand-50', fg: 'text-black' },
    { step: 100, bg: 'bg-brand-100', fg: 'text-black' },
    { step: 200, bg: 'bg-brand-200', fg: 'text-black' },
    { step: 300, bg: 'bg-brand-300', fg: 'text-black' },
    { step: 400, bg: 'bg-brand-400', fg: 'text-white' },
    { step: 500, bg: 'bg-brand-500', fg: 'text-white' },
    { step: 600, bg: 'bg-brand-600', fg: 'text-white' },
    { step: 700, bg: 'bg-brand-700', fg: 'text-white' },
    { step: 800, bg: 'bg-brand-800', fg: 'text-white' },
    { step: 900, bg: 'bg-brand-900', fg: 'text-white' },
  ];

  return (
    // (a) Page surface + text via preset tokens. `font-sans` is the preset's
    // `--ku-font-family-base`.
    <div className="min-h-screen bg-canvas font-sans text-fg">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header: Tailwind layout, preset colors. */}
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-fg">@koduhai/design-system + Tailwind</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Class-based theming, the brand tint ramp, and real components, all driven by the
              Tailwind preset.
            </p>
          </div>
          {/* (c) Theme toggle — a real <Button> that flips the <html> class. */}
          <Button variant="outline" tone="primary" onClick={toggleTheme}>
            {dark ? 'Switch to light' : 'Switch to dark'}
          </Button>
        </header>

        {/* (a) Semantic color tokens as Tailwind utilities. */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-fg">
            Semantic tokens (Tailwind utilities)
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-primary p-4 text-primary-contrast">bg-primary</div>
            <div className="rounded-md bg-success p-4 text-success-fg">bg-success</div>
            <div className="rounded-md bg-danger p-4 text-danger-fg">bg-danger</div>
            <div className="rounded-md bg-warning p-4 text-warning-fg">bg-warning</div>
            <div className="rounded-md bg-info p-4 text-info-fg">bg-info</div>
            <div className="rounded-md bg-accent p-4 text-accent-fg">bg-accent</div>
            <div className="rounded-md border border-border bg-surface p-4 text-fg">bg-surface</div>
            <div className="rounded-md border border-border bg-raised p-4 text-fg">bg-raised</div>
            <div className="rounded-md border border-border bg-canvas p-4 text-fg-muted">
              bg-canvas / fg-muted
            </div>
          </div>
        </section>

        {/* (b) The fixed brand tint ramp — same values in dark and light. */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-fg">
            Brand tint ramp (theme-independent)
          </h2>
          <div className="flex overflow-hidden rounded-md border border-border">
            {brandRamp.map(({ step, bg, fg }) => (
              <div key={step} className={`flex-1 py-6 text-center text-xs ${bg} ${fg}`}>
                {step}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-fg-muted">
            e.g. <code className="font-mono">bg-brand-500</code>,{' '}
            <code className="font-mono">bg-brand-600</code>
          </p>
        </section>

        {/* (d) Real components alongside Tailwind markup. */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-fg">Design-system components</h2>
          <Card variant="elevated" padding="lg">
            <CardHeader>
              <h3 className="text-base font-semibold text-fg">Card + Button (CSS Modules)</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-fg-muted">
                This <code className="font-mono">&lt;Card&gt;</code> is styled by the design
                system&apos;s hashed CSS Modules, while the text uses Tailwind utilities bound to
                preset tokens. The two never collide.
              </p>
            </CardBody>
            <CardFooter>
              <div className="flex flex-wrap gap-3">
                <Button tone="primary">Primary</Button>
                <Button tone="success" variant="outline">
                  Success
                </Button>
                <Button tone="danger" variant="ghost">
                  Danger
                </Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  );
}

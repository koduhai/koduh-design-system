# Phase 0 — Foundations & Build Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the foundation of the from-scratch `@koduhai/design-system` v1 — design tokens, the small primitives/a11y layer, a vendored SVG icon set, the theme provider, and a fully wired build/test/Storybook pipeline — proven end to end before any of the 12 components are built.

**Architecture:** Four layers (tokens → primitives → components → provider). Design tokens live in TypeScript and are compiled to CSS custom properties under `[data-theme="dark"|"light"]`; component styling will use CSS Modules (zero-runtime). This phase builds layers 1, 2, and 4 plus the icon set, and validates that the tsup build correctly extracts CSS Modules into a single stylesheet.

**Tech Stack:** React 18/19, TypeScript (strict), tsup (esbuild) for build, Vitest + React Testing Library + jsdom for unit tests, Playwright + axe-core for e2e/a11y, Storybook 10 (react-vite), CSS Modules + CSS custom properties.

**Reference spec:** `docs/superpowers/specs/2026-05-21-custom-design-system-design.md`

---

## File Structure (created in this phase)

```
koduhai-design-system-v2/
├── package.json                     # package metadata, scripts, exports map
├── tsconfig.json                    # strict TS config
├── tsup.config.ts                   # build (CJS+ESM+DTS), CSS extraction
├── vitest.config.ts                 # unit test config (jsdom, css stubbed)
├── vitest.setup.ts                  # RTL + jest-dom + matchMedia mock
├── playwright.config.ts             # e2e config, auto-starts Storybook
├── eslint.config.js                 # flat ESLint config
├── .prettierrc                      # formatting
├── .gitignore
├── .storybook/
│   ├── main.ts                      # Storybook config
│   └── preview.tsx                  # theme decorator + global toolbar toggle
├── scripts/
│   └── generate-theme-css.ts        # tokens (TS) -> dist/theme.css generator
├── e2e/
│   └── foundations.spec.ts          # smoke a11y test against Storybook
├── src/
│   ├── index.ts                     # main entry: re-exports everything
│   ├── theme/
│   │   ├── tokens.ts                # single source of truth for all tokens
│   │   └── index.ts                 # theme entry (tokens + types)
│   ├── primitives/
│   │   ├── mergeRefs.ts
│   │   ├── composeEventHandlers.ts
│   │   ├── useId.ts
│   │   ├── useControllableState.ts
│   │   ├── Slot.tsx                 # asChild polymorphism
│   │   ├── VisuallyHidden.tsx
│   │   └── index.ts
│   ├── icons/
│   │   ├── createIcon.tsx           # icon factory
│   │   ├── icons.tsx                # individual icon components
│   │   └── index.ts
│   ├── provider/
│   │   ├── KoduhThemeProvider.tsx
│   │   ├── useColorMode.ts
│   │   └── index.ts
│   └── styles/
│       └── reset.css                # global reset/normalize (CssBaseline equiv)
```

**Decomposition rationale:** Each primitive is one file with one responsibility so it can be tested in isolation. Tokens are the single source of truth consumed by both the CSS generator and TS consumers. The provider owns theme state and the global reset import (which also proves CSS bundling in the build).

---

## Task 1: Project scaffold & tooling

**Files:**

- Create: `package.json`, `tsconfig.json`, `.gitignore`, `.prettierrc`, `eslint.config.js`, `vitest.config.ts`, `vitest.setup.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@koduhai/design-system",
  "version": "1.0.0-alpha.0",
  "description": "Koduh AI Design System — custom-built, MUI-free",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./theme": {
      "types": "./dist/theme/index.d.ts",
      "import": "./dist/theme/index.mjs",
      "require": "./dist/theme/index.js"
    },
    "./icons": {
      "types": "./dist/icons/index.d.ts",
      "import": "./dist/icons/index.mjs",
      "require": "./dist/icons/index.js"
    },
    "./styles.css": "./dist/index.css",
    "./theme.css": "./dist/theme.css"
  },
  "sideEffects": ["**/*.css"],
  "files": ["dist"],
  "scripts": {
    "build": "npm run build:tokens && tsup",
    "build:tokens": "tsx scripts/generate-theme-css.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "lint": "eslint src",
    "format": "prettier --write src",
    "format:check": "prettier --check src"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/koduhai/koduhai-design-system-v2.git"
  },
  "license": "UNLICENSED",
  "devDependencies": {
    "@axe-core/playwright": "^4.11.1",
    "@playwright/test": "^1.58.2",
    "@storybook/addon-a11y": "^10.2.16",
    "@storybook/react-vite": "^10.2.16",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^10.0.2",
    "jsdom": "^28.1.0",
    "prettier": "^3.8.1",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "storybook": "^10.2.16",
    "tsup": "^8.5.1",
    "tsx": "^4.19.2",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.56.1",
    "vitest": "^4.0.18"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src", "scripts", "e2e", "*.config.ts", ".storybook"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
storybook-static/
test-results/
playwright-report/
*.log
.DS_Store
```

- [ ] **Step 4: Create `.prettierrc`**

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 100
}
```

- [ ] **Step 5: Create `eslint.config.js`**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
```

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false, // CSS imports are stubbed in unit tests (zero-runtime styling)
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 7: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia; provide a no-op mock for the provider.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: completes; `node_modules/` populated; no peer-dependency errors.

- [ ] **Step 9: Verify the toolchain runs**

Run: `npm run typecheck`
Expected: PASS (no files yet to type-check beyond configs → exits 0).

Run: `npm test`
Expected: Vitest reports "No test files found" and exits 0 (acceptable at this stage).

- [ ] **Step 10: Commit**

```bash
git add package.json tsconfig.json .gitignore .prettierrc eslint.config.js vitest.config.ts vitest.setup.ts package-lock.json
git commit -m "chore: scaffold project tooling (ts, vitest, eslint, prettier)"
```

---

## Task 2: Design tokens

**Files:**

- Create: `src/theme/tokens.ts`
- Create: `src/theme/index.ts`
- Test: `src/theme/tokens.test.ts`

- [ ] **Step 1: Write the failing test**

`src/theme/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { tokens, themes } from './tokens';

describe('tokens', () => {
  it('exposes the core token scales', () => {
    expect(tokens.space[1]).toBe('4px');
    expect(tokens.radius.md).toBeTruthy();
    expect(Object.keys(tokens.fontSize).length).toBeGreaterThan(0);
  });

  it('defines both dark and light themes with matching color keys', () => {
    const darkKeys = Object.keys(themes.dark.color).sort();
    const lightKeys = Object.keys(themes.light.color).sort();
    expect(darkKeys).toEqual(lightKeys);
    expect(darkKeys).toContain('primary');
    expect(darkKeys).toContain('bgDefault');
    expect(darkKeys).toContain('textPrimary');
  });

  it('dark is the default-documented primary theme', () => {
    expect(themes.dark.color.bgDefault).toMatch(/^#/);
    expect(themes.light.color.bgDefault).toMatch(/^#/);
    expect(themes.dark.color.bgDefault).not.toBe(themes.light.color.bgDefault);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/theme/tokens.test.ts`
Expected: FAIL — cannot resolve `./tokens`.

- [ ] **Step 3: Write the implementation**

`src/theme/tokens.ts`:

```ts
// Single source of truth for all design tokens.
// Theme-independent scales live in `tokens`; color values that change between
// dark/light live in `themes`. The generate-theme-css script turns these into
// CSS custom properties; components only ever read the CSS variables.

export const tokens = {
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  fontFamily: {
    base: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    base: '1.5',
    relaxed: '1.7',
  },
  shadow: {
    1: '0 1px 2px rgba(0,0,0,0.4)',
    2: '0 2px 8px rgba(0,0,0,0.45)',
    3: '0 8px 24px rgba(0,0,0,0.5)',
  },
  zIndex: {
    appbar: '1100',
    sidebar: '1000',
  },
  breakpoint: {
    sm: '600px',
    md: '900px',
    lg: '1200px',
    xl: '1536px',
  },
  duration: {
    fast: '120ms',
    base: '200ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
  },
} as const;

// Color tokens per theme. Values chosen to meet WCAG AA (verified at the
// component level via axe-core e2e tests).
export const themes = {
  dark: {
    color: {
      primary: '#5B9DFF',
      primaryContrast: '#0A0E1A',
      danger: '#FF6B6B',
      success: '#4ADE80',
      warning: '#FBBF24',
      info: '#5B9DFF',
      bgDefault: '#0A0E1A',
      bgSurface: '#141A2A',
      bgRaised: '#1C2438',
      border: '#2A3346',
      textPrimary: '#F5F7FA',
      textSecondary: '#A8B2C4',
      textDisabled: '#5C667A',
    },
  },
  light: {
    color: {
      primary: '#1B5FCC',
      primaryContrast: '#FFFFFF',
      danger: '#C62828',
      success: '#1B7F3B',
      warning: '#9A6700',
      info: '#1B5FCC',
      bgDefault: '#FFFFFF',
      bgSurface: '#F4F6FA',
      bgRaised: '#FFFFFF',
      border: '#D4DAE5',
      textPrimary: '#10141F',
      textSecondary: '#4A5468',
      textDisabled: '#9AA3B5',
    },
  },
} as const;

export type ColorMode = keyof typeof themes;
export type ColorTokenName = keyof (typeof themes)['dark']['color'];
export type Tokens = typeof tokens;
```

- [ ] **Step 4: Create the theme entry `src/theme/index.ts`**

```ts
export { tokens, themes } from './tokens';
export type { ColorMode, ColorTokenName, Tokens } from './tokens';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/theme/tokens.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/theme
git commit -m "feat: add design tokens (scales + dark/light color themes)"
```

---

## Task 3: Theme CSS generation script

**Files:**

- Create: `scripts/generate-theme-css.ts`
- Test: `scripts/generate-theme-css.test.ts`

This script converts tokens into CSS custom properties. The pure transform function is unit-tested; the file-writing wrapper runs at build time.

- [ ] **Step 1: Write the failing test**

`scripts/generate-theme-css.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildThemeCss } from './generate-theme-css';

describe('buildThemeCss', () => {
  const css = buildThemeCss();

  it('declares scale variables on :root', () => {
    expect(css).toMatch(/:root\s*\{/);
    expect(css).toContain('--ku-space-1: 4px;');
    expect(css).toContain('--ku-radius-md:');
  });

  it('declares dark theme as the default on :root and [data-theme="dark"]', () => {
    expect(css).toContain('--ku-color-bg-default: #0A0E1A;');
    expect(css).toMatch(/\[data-theme="dark"\]/);
  });

  it('declares light theme overrides under [data-theme="light"]', () => {
    expect(css).toMatch(/\[data-theme="light"\]\s*\{[^}]*--ku-color-bg-default: #FFFFFF;/s);
  });

  it('converts camelCase token names to kebab-case variables', () => {
    expect(css).toContain('--ku-color-text-primary:');
    expect(css).toContain('--ku-color-bg-surface:');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/generate-theme-css.test.ts`
Expected: FAIL — cannot resolve `./generate-theme-css`.

- [ ] **Step 3: Write the implementation**

`scripts/generate-theme-css.ts`:

```ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokens, themes } from '../src/theme/tokens';

const camelToKebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function scaleVars(): string {
  const lines: string[] = [];
  for (const [scaleName, scale] of Object.entries(tokens)) {
    for (const [key, value] of Object.entries(scale)) {
      lines.push(`  --ku-${camelToKebab(scaleName)}-${camelToKebab(String(key))}: ${value};`);
    }
  }
  return lines.join('\n');
}

function colorVars(mode: 'dark' | 'light'): string {
  return Object.entries(themes[mode].color)
    .map(([name, value]) => `  --ku-color-${camelToKebab(name)}: ${value};`)
    .join('\n');
}

export function buildThemeCss(): string {
  return [
    '/* AUTO-GENERATED by scripts/generate-theme-css.ts — do not edit by hand. */',
    `:root {\n${scaleVars()}\n${colorVars('dark')}\n}`,
    `:root[data-theme='dark'], [data-theme="dark"] {\n${colorVars('dark')}\n}`,
    `:root[data-theme='light'], [data-theme="light"] {\n${colorVars('light')}\n}`,
    '',
  ].join('\n\n');
}

// CLI entry: write to dist/theme.css (called by `npm run build:tokens`).
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'theme.css'), buildThemeCss(), 'utf8');
  // eslint-disable-next-line no-console
  console.log('Wrote dist/theme.css');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/generate-theme-css.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Verify the CLI writes the file**

Run: `npm run build:tokens`
Expected: prints `Wrote dist/theme.css`; `dist/theme.css` exists and contains `--ku-color-bg-default`.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-theme-css.ts scripts/generate-theme-css.test.ts
git commit -m "feat: generate theme.css custom properties from tokens"
```

---

## Task 4: Global reset stylesheet

**Files:**

- Create: `src/styles/reset.css`

This is plain CSS (no test); it is validated by the build (Task 9) and Storybook (Task 11).

- [ ] **Step 1: Create `src/styles/reset.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

html,
body {
  height: 100%;
}

body {
  font-family: var(--ku-font-family-base);
  font-size: var(--ku-font-size-md);
  line-height: var(--ku-line-height-base);
  color: var(--ku-color-text-primary);
  background-color: var(--ku-color-bg-default);
  -webkit-font-smoothing: antialiased;
}

button,
input,
textarea,
select {
  font: inherit;
  color: inherit;
}

a {
  color: inherit;
}

:focus-visible {
  outline: 2px solid var(--ku-color-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/reset.css
git commit -m "feat: add global reset stylesheet"
```

---

## Task 5: Primitive — mergeRefs

**Files:**

- Create: `src/primitives/mergeRefs.ts`
- Test: `src/primitives/mergeRefs.test.ts`

- [ ] **Step 1: Write the failing test**

`src/primitives/mergeRefs.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { mergeRefs } from './mergeRefs';

describe('mergeRefs', () => {
  it('assigns the node to object refs and calls function refs', () => {
    const objectRef = { current: null as string | null };
    const fnRef = vi.fn();
    const merged = mergeRefs(objectRef, fnRef);

    merged('node');

    expect(objectRef.current).toBe('node');
    expect(fnRef).toHaveBeenCalledWith('node');
  });

  it('ignores null and undefined refs', () => {
    const merged = mergeRefs<string>(null, undefined);
    expect(() => merged('node')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/primitives/mergeRefs.test.ts`
Expected: FAIL — cannot resolve `./mergeRefs`.

- [ ] **Step 3: Write the implementation**

`src/primitives/mergeRefs.ts`:

```ts
import type { Ref, MutableRefObject } from 'react';

/** Combine multiple refs into one callback ref. */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as MutableRefObject<T | null>).current = node;
      }
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/primitives/mergeRefs.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/primitives/mergeRefs.ts src/primitives/mergeRefs.test.ts
git commit -m "feat: add mergeRefs primitive"
```

---

## Task 6: Primitive — composeEventHandlers

**Files:**

- Create: `src/primitives/composeEventHandlers.ts`
- Test: `src/primitives/composeEventHandlers.test.ts`

- [ ] **Step 1: Write the failing test**

`src/primitives/composeEventHandlers.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { composeEventHandlers } from './composeEventHandlers';

describe('composeEventHandlers', () => {
  it('calls the consumer handler then the internal handler', () => {
    const order: string[] = [];
    const theirs = () => order.push('theirs');
    const ours = () => order.push('ours');
    const handler = composeEventHandlers(theirs, ours);

    handler({ defaultPrevented: false } as Event);

    expect(order).toEqual(['theirs', 'ours']);
  });

  it('skips the internal handler when the consumer prevents default', () => {
    const ours = vi.fn();
    const handler = composeEventHandlers(() => {}, ours);

    handler({ defaultPrevented: true } as Event);

    expect(ours).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/primitives/composeEventHandlers.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Write the implementation**

`src/primitives/composeEventHandlers.ts`:

```ts
/** Run a consumer's handler first, then ours unless the consumer prevented default. */
export function composeEventHandlers<E extends { defaultPrevented?: boolean }>(
  theirHandler: ((event: E) => void) | undefined,
  ourHandler: ((event: E) => void) | undefined,
): (event: E) => void {
  return (event) => {
    theirHandler?.(event);
    if (!event.defaultPrevented) {
      ourHandler?.(event);
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/primitives/composeEventHandlers.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/primitives/composeEventHandlers.ts src/primitives/composeEventHandlers.test.ts
git commit -m "feat: add composeEventHandlers primitive"
```

---

## Task 7: Primitive — useId

**Files:**

- Create: `src/primitives/useId.ts`
- Test: `src/primitives/useId.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/primitives/useId.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useId } from './useId';

describe('useId', () => {
  it('returns a string with the default prefix and no colons', () => {
    const { result } = renderHook(() => useId());
    expect(result.current.startsWith('ku-')).toBe(true);
    expect(result.current).not.toContain(':');
  });

  it('uses a custom prefix', () => {
    const { result } = renderHook(() => useId('field'));
    expect(result.current.startsWith('field-')).toBe(true);
  });

  it('is stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useId());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/primitives/useId.test.tsx`
Expected: FAIL — cannot resolve `./useId`.

- [ ] **Step 3: Write the implementation**

`src/primitives/useId.ts`:

```ts
import { useId as useReactId } from 'react';

/** SSR-safe unique id with a stable, colon-free prefix (safe for CSS selectors). */
export function useId(prefix = 'ku'): string {
  const reactId = useReactId();
  return `${prefix}-${reactId.replace(/:/g, '')}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/primitives/useId.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/primitives/useId.ts src/primitives/useId.test.tsx
git commit -m "feat: add useId primitive"
```

---

## Task 8: Primitive — useControllableState

**Files:**

- Create: `src/primitives/useControllableState.ts`
- Test: `src/primitives/useControllableState.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/primitives/useControllableState.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useControllableState } from './useControllableState';

describe('useControllableState', () => {
  it('manages internal state when uncontrolled', () => {
    const { result } = renderHook(() => useControllableState<string>({ defaultValue: 'a' }));
    expect(result.current[0]).toBe('a');
    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');
  });

  it('respects a controlled value and does not change it internally', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<string>({ value: 'fixed', onChange }));
    expect(result.current[0]).toBe('fixed');
    act(() => result.current[1]('next'));
    expect(result.current[0]).toBe('fixed'); // controlled value unchanged
    expect(onChange).toHaveBeenCalledWith('next');
  });

  it('calls onChange in uncontrolled mode too', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<string>({ defaultValue: 'a', onChange }),
    );
    act(() => result.current[1]('b'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/primitives/useControllableState.test.tsx`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Write the implementation**

`src/primitives/useControllableState.ts`:

```ts
import { useCallback, useState } from 'react';

interface UseControllableStateParams<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

/** Unify controlled and uncontrolled value handling behind one [state, setState] API. */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateParams<T>): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = useState<T | undefined>(defaultValue);
  const isControlled = value !== undefined;
  const current = (isControlled ? value : uncontrolled) as T;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setUncontrolled(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/primitives/useControllableState.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/primitives/useControllableState.ts src/primitives/useControllableState.test.tsx
git commit -m "feat: add useControllableState primitive"
```

---

## Task 9: Primitive — Slot (asChild polymorphism)

**Files:**

- Create: `src/primitives/Slot.tsx`
- Test: `src/primitives/Slot.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/primitives/Slot.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slot } from './Slot';

describe('Slot', () => {
  it('merges props onto its single child element', () => {
    render(
      <Slot data-testid="slot" className="slot-class">
        <a href="/contact" className="child-class">
          Contact
        </a>
      </Slot>,
    );
    const link = screen.getByRole('link', { name: 'Contact' });
    expect(link).toHaveAttribute('href', '/contact');
    expect(link.className).toContain('slot-class');
    expect(link.className).toContain('child-class');
  });

  it('composes event handlers from slot and child', async () => {
    const slotClick = vi.fn();
    const childClick = vi.fn();
    render(
      <Slot onClick={slotClick}>
        <button onClick={childClick}>Go</button>
      </Slot>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(childClick).toHaveBeenCalledTimes(1);
    expect(slotClick).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when child is not a valid element', () => {
    const { container } = render(<Slot>{'just text'}</Slot>);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/primitives/Slot.test.tsx`
Expected: FAIL — cannot resolve `./Slot`.

- [ ] **Step 3: Write the implementation**

`src/primitives/Slot.tsx`:

```tsx
import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { HTMLAttributes, ReactElement, Ref } from 'react';
import { mergeRefs } from './mergeRefs';
import { composeEventHandlers } from './composeEventHandlers';

export interface SlotProps extends HTMLAttributes<HTMLElement> {}

type AnyProps = Record<string, unknown>;

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps, ...childProps };

  for (const key of Object.keys(slotProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    const isHandler = /^on[A-Z]/.test(key);

    if (isHandler && typeof slotValue === 'function') {
      merged[key] = composeEventHandlers(
        childValue as ((event: unknown) => void) | undefined,
        slotValue as (event: unknown) => void,
      );
    } else if (key === 'className') {
      merged[key] = [slotValue, childValue].filter(Boolean).join(' ');
    } else if (key === 'style') {
      merged[key] = { ...(slotValue as object), ...(childValue as object) };
    }
  }

  return merged;
}

/**
 * Renders its single child, merging the slot's props/className/handlers/ref onto it.
 * Enables the `asChild` pattern: a component delegates rendering to a consumer element
 * (e.g. an `<a>` or router `<Link>`) without an `as`/`component` prop.
 */
export const Slot = forwardRef<HTMLElement, SlotProps & { children?: React.ReactNode }>(
  function Slot({ children, ...slotProps }, forwardedRef) {
    if (!isValidElement(children)) {
      return null;
    }
    const child = Children.only(children) as ReactElement<AnyProps> & { ref?: Ref<HTMLElement> };
    const childRef = (child as { ref?: Ref<HTMLElement> }).ref;

    return cloneElement(child, {
      ...mergeProps(slotProps as AnyProps, child.props),
      ref: forwardedRef ? mergeRefs(forwardedRef, childRef) : childRef,
    } as AnyProps);
  },
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/primitives/Slot.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/primitives/Slot.tsx src/primitives/Slot.test.tsx
git commit -m "feat: add Slot primitive for asChild polymorphism"
```

---

## Task 10: Primitive — VisuallyHidden + primitives barrel

**Files:**

- Create: `src/primitives/VisuallyHidden.tsx`
- Create: `src/primitives/index.ts`
- Test: `src/primitives/VisuallyHidden.test.tsx`

VisuallyHidden uses a constant inline style object (no CSS Module) so the primitives layer has zero CSS-pipeline dependency.

- [ ] **Step 1: Write the failing test**

`src/primitives/VisuallyHidden.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders content available to assistive tech but visually clipped', () => {
    render(<VisuallyHidden>Close menu</VisuallyHidden>);
    const el = screen.getByText('Close menu');
    expect(el).toBeInTheDocument();
    expect(el.style.position).toBe('absolute');
    expect(el.style.width).toBe('1px');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/primitives/VisuallyHidden.test.tsx`
Expected: FAIL — cannot resolve `./VisuallyHidden`.

- [ ] **Step 3: Write the implementation**

`src/primitives/VisuallyHidden.tsx`:

```tsx
import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';

const hiddenStyle: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/** Visually hides content while keeping it available to screen readers. */
export const VisuallyHidden = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function VisuallyHidden({ style, ...props }, ref) {
    return <span ref={ref} style={{ ...hiddenStyle, ...style }} {...props} />;
  },
);
```

- [ ] **Step 4: Create the primitives barrel `src/primitives/index.ts`**

```ts
export { mergeRefs } from './mergeRefs';
export { composeEventHandlers } from './composeEventHandlers';
export { useId } from './useId';
export { useControllableState } from './useControllableState';
export { Slot } from './Slot';
export type { SlotProps } from './Slot';
export { VisuallyHidden } from './VisuallyHidden';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/primitives/VisuallyHidden.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Run the full primitives suite**

Run: `npx vitest run src/primitives`
Expected: PASS (all primitive tests green).

- [ ] **Step 7: Commit**

```bash
git add src/primitives/VisuallyHidden.tsx src/primitives/VisuallyHidden.test.tsx src/primitives/index.ts
git commit -m "feat: add VisuallyHidden primitive and primitives barrel"
```

---

## Task 11: Icon factory + initial icon set

**Files:**

- Create: `src/icons/createIcon.tsx`
- Create: `src/icons/icons.tsx`
- Create: `src/icons/index.ts`
- Test: `src/icons/createIcon.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/icons/createIcon.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createIcon } from './createIcon';

const TestIcon = createIcon('TestIcon', <path d="M0 0h24v24H0z" />);

describe('createIcon', () => {
  it('renders an svg using currentColor and a default size of 24', () => {
    const { container } = render(<TestIcon />);
    const svg = container.querySelector('svg')!;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
    expect(svg.getAttribute('fill')).toBe('currentColor');
  });

  it('is decorative (aria-hidden) by default', () => {
    const { container } = render(<TestIcon />);
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('becomes labelled (not hidden) when given a title', () => {
    const { container, getByText } = render(<TestIcon title="Test" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(svg.getAttribute('role')).toBe('img');
    expect(getByText('Test').tagName.toLowerCase()).toBe('title');
  });

  it('accepts a custom size', () => {
    const { container } = render(<TestIcon size={16} />);
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('16');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/icons/createIcon.test.tsx`
Expected: FAIL — cannot resolve `./createIcon`.

- [ ] **Step 3: Write the factory `src/icons/createIcon.tsx`**

```tsx
import { forwardRef } from 'react';
import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Width/height in px (icons are square). Defaults to 24. */
  size?: number | string;
  /** Accessible label. When set, the icon is exposed as an image with this name. */
  title?: string;
}

/** Build a standalone icon component from raw SVG path content. */
export function createIcon(displayName: string, path: ReactNode) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size = 24, title, ...props },
    ref,
  ) {
    const labelled = title != null;
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={labelled ? undefined : true}
        role={labelled ? 'img' : undefined}
        {...props}
      >
        {labelled ? <title>{title}</title> : null}
        {path}
      </svg>
    );
  });
  Icon.displayName = displayName;
  return Icon;
}
```

- [ ] **Step 4: Write the initial icon set `src/icons/icons.tsx`**

```tsx
import { createIcon } from './createIcon';

// Minimal vendored set covering the 12 components + common app usage.
export const CloseIcon = createIcon(
  'CloseIcon',
  <path d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.7 2.88 18.29 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.29-6.3z" />,
);

export const ChevronDownIcon = createIcon(
  'ChevronDownIcon',
  <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />,
);

export const CheckIcon = createIcon(
  'CheckIcon',
  <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
);

export const InfoIcon = createIcon(
  'InfoIcon',
  <path d="M11 9h2V7h-2m1 13a8 8 0 1 1 0-16 8 8 0 0 1 0 16m0-18a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1 15h2v-6h-2z" />,
);

export const WarningIcon = createIcon(
  'WarningIcon',
  <path d="M1 21h22L12 2zm12-3h-2v-2h2zm0-4h-2v-4h2z" />,
);

export const ErrorIcon = createIcon(
  'ErrorIcon',
  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 15h-2v-2h2zm0-4h-2V7h2z" />,
);

export const MenuIcon = createIcon('MenuIcon', <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />);

export const SearchIcon = createIcon(
  'SearchIcon',
  <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14" />,
);

export const UserIcon = createIcon(
  'UserIcon',
  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10m0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5" />,
);
```

- [ ] **Step 5: Create the icons barrel `src/icons/index.ts`**

```ts
export { createIcon } from './createIcon';
export type { IconProps } from './createIcon';
export * from './icons';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/icons/createIcon.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add src/icons
git commit -m "feat: add SVG icon factory and initial vendored icon set"
```

---

## Task 12: KoduhThemeProvider + useColorMode

**Files:**

- Create: `src/provider/useColorMode.ts`
- Create: `src/provider/KoduhThemeProvider.tsx`
- Create: `src/provider/index.ts`
- Test: `src/provider/KoduhThemeProvider.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/provider/KoduhThemeProvider.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/provider/KoduhThemeProvider.test.tsx`
Expected: FAIL — cannot resolve `./KoduhThemeProvider`.

- [ ] **Step 3: Write the context + hook `src/provider/useColorMode.ts`**

```ts
import { createContext, useContext } from 'react';
import type { ColorMode } from '../theme/tokens';

export interface ColorModeContextValue {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextValue | null>(null);

/** Read and control the current color mode. Must be used within KoduhThemeProvider. */
export function useColorMode(): ColorModeContextValue {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error('useColorMode must be used within a KoduhThemeProvider');
  }
  return ctx;
}
```

- [ ] **Step 4: Write the provider `src/provider/KoduhThemeProvider.tsx`**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ColorMode } from '../theme/tokens';
import { ColorModeContext } from './useColorMode';
import '../styles/reset.css';

export interface KoduhThemeProviderProps {
  children: ReactNode;
  /** Initial mode when nothing is persisted. Defaults to 'dark'. */
  defaultMode?: ColorMode;
  /** localStorage key for persistence. */
  storageKey?: string;
  /** Disable reading/writing localStorage. */
  disablePersistence?: boolean;
}

function readStoredMode(storageKey: string, fallback: ColorMode): ColorMode {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(storageKey);
  return stored === 'dark' || stored === 'light' ? stored : fallback;
}

export function KoduhThemeProvider({
  children,
  defaultMode = 'dark',
  storageKey = 'koduh-color-mode',
  disablePersistence = false,
}: KoduhThemeProviderProps) {
  const [mode, setModeState] = useState<ColorMode>(() =>
    disablePersistence ? defaultMode : readStoredMode(storageKey, defaultMode),
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const setMode = useCallback(
    (next: ColorMode) => {
      setModeState(next);
      if (!disablePersistence && typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, next);
      }
    },
    [disablePersistence, storageKey],
  );

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (!disablePersistence && typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, next);
      }
      return next;
    });
  }, [disablePersistence, storageKey]);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}
```

- [ ] **Step 5: Create the provider barrel `src/provider/index.ts`**

```ts
export { KoduhThemeProvider } from './KoduhThemeProvider';
export type { KoduhThemeProviderProps } from './KoduhThemeProvider';
export { useColorMode } from './useColorMode';
export type { ColorModeContextValue } from './useColorMode';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/provider/KoduhThemeProvider.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add src/provider
git commit -m "feat: add KoduhThemeProvider and useColorMode"
```

---

## Task 13: Package entry & full unit suite

**Files:**

- Create: `src/index.ts`

- [ ] **Step 1: Create the main entry `src/index.ts`**

```ts
// Provider + hooks
export { KoduhThemeProvider, useColorMode } from './provider';
export type { KoduhThemeProviderProps, ColorModeContextValue } from './provider';

// Primitives (public utilities reused by component consumers)
export {
  Slot,
  VisuallyHidden,
  mergeRefs,
  composeEventHandlers,
  useId,
  useControllableState,
} from './primitives';
export type { SlotProps } from './primitives';

// Theme tokens
export { tokens, themes } from './theme';
export type { ColorMode, ColorTokenName, Tokens } from './theme';

// NOTE: the 12 components are exported here as they are built in Phases 1–4.
```

- [ ] **Step 2: Run the full unit suite**

Run: `npm test`
Expected: PASS — all suites from Tasks 2–12 green, zero failures.

- [ ] **Step 3: Typecheck the whole project**

Run: `npm run typecheck`
Expected: PASS, no errors.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: PASS (no errors; fix any reported issues before committing).

- [ ] **Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: add package entry barrel"
```

---

## Task 14: Build pipeline + CSS Modules extraction validation

**Files:**

- Create: `tsup.config.ts`
- Create (temporary spike): `src/_spike/Spike.tsx`, `src/_spike/Spike.module.css`

This task proves the riskiest assumption (Risk #1 in the spec): that tsup extracts CSS Modules into a single stylesheet with scoped class names. We validate with a throwaway component, then remove it.

- [ ] **Step 1: Create `tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/theme/index.ts', 'src/icons/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: false, // keep dist/theme.css produced by build:tokens
  sourcemap: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // esbuild handles *.module.css as CSS Modules and emits a bundled stylesheet.
  loader: { '.css': 'css' },
});
```

- [ ] **Step 2: Create the spike component `src/_spike/Spike.module.css`**

```css
.box {
  padding: var(--ku-space-4);
  border-radius: var(--ku-radius-md);
  background-color: var(--ku-color-bg-surface);
  color: var(--ku-color-text-primary);
}
```

- [ ] **Step 3: Create `src/_spike/Spike.tsx`**

```tsx
import styles from './Spike.module.css';

export function Spike() {
  return <div className={styles.box}>spike</div>;
}
```

- [ ] **Step 4: Temporarily export the spike from `src/index.ts`**

Add this line to the bottom of `src/index.ts`:

```ts
export { Spike } from './_spike/Spike';
```

- [ ] **Step 5: Run the build**

Run: `npm run build`
Expected: `dist/theme.css` written, then tsup emits `dist/index.js`, `dist/index.mjs`, `dist/index.d.ts`, `dist/theme/*`, `dist/icons/*`, and a bundled `dist/index.css`.

- [ ] **Step 6: Verify CSS extraction worked**

Run: `node -e "const s=require('fs').readFileSync('dist/index.css','utf8'); if(!/var\(--ku-space-4\)/.test(s)) throw new Error('reset/spike CSS missing'); if(!/\.box|_box_/.test(s)) console.log('NOTE: inspect class scoping'); console.log('index.css OK, length', s.length)"`
Expected: prints `index.css OK, length <n>` — confirms `reset.css` and the spike module CSS were both bundled into `dist/index.css`. The class name should be hash-scoped (e.g. `_box_ab123`).

> If `dist/index.css` is missing or empty, CSS Module extraction needs a plugin. Fallback: add `esbuild-plugin-css-modules` (or `postcss` + `tsup`'s `esbuildPlugins`) and re-run. Document the resolution in the spec's Risk #1 row.

- [ ] **Step 7: Remove the spike**

Delete `src/_spike/Spike.tsx`, `src/_spike/Spike.module.css`, the `src/_spike` directory, and the `export { Spike }` line from `src/index.ts`.

- [ ] **Step 8: Rebuild and re-verify the clean build**

Run: `npm run build`
Expected: build succeeds; `dist/index.css` still contains the reset CSS (`var(--ku-space-4)` from reset's body styles is not present, but the reset selectors are — confirm with the command below).

Run: `node -e "const s=require('fs').readFileSync('dist/index.css','utf8'); if(!/box-sizing/.test(s)) throw new Error('reset missing'); console.log('clean index.css OK')"`
Expected: prints `clean index.css OK`.

- [ ] **Step 9: Commit**

```bash
git add tsup.config.ts src/index.ts
git commit -m "build: configure tsup with CSS module extraction (validated)"
```

---

## Task 15: Storybook setup + theme decorator

**Files:**

- Create: `.storybook/main.ts`
- Create: `.storybook/preview.tsx`
- Create: `src/icons/Icons.stories.tsx` (sample story to render in Storybook)

- [ ] **Step 1: Create `.storybook/main.ts`**

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

- [ ] **Step 2: Create `.storybook/preview.tsx`**

```tsx
import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { KoduhThemeProvider } from '../src/provider';
import type { ColorMode } from '../src/theme';
import '../src/styles/reset.css';

// theme.css must exist (run `npm run build:tokens` once); import the generated vars.
import '../dist/theme.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color mode',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const mode = context.globals.theme as ColorMode;
      useEffect(() => {
        document.documentElement.setAttribute('data-theme', mode);
      }, [mode]);
      return (
        <KoduhThemeProvider defaultMode={mode} disablePersistence>
          <div style={{ padding: 24, minHeight: '100vh' }}>
            <Story />
          </div>
        </KoduhThemeProvider>
      );
    },
  ],
  parameters: {
    backgrounds: { disable: true },
  },
};

export default preview;
```

- [ ] **Step 3: Create a sample story `src/icons/Icons.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CloseIcon,
  CheckIcon,
  InfoIcon,
  WarningIcon,
  ErrorIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from './icons';

const meta: Meta = {
  title: 'Foundations/Icons',
};
export default meta;

type Story = StoryObj;

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, color: 'var(--ku-color-text-primary)' }}>
      <CloseIcon title="Close" />
      <CheckIcon title="Check" />
      <InfoIcon title="Info" />
      <WarningIcon title="Warning" />
      <ErrorIcon title="Error" />
      <MenuIcon title="Menu" />
      <SearchIcon title="Search" />
      <UserIcon title="User" />
    </div>
  ),
};
```

- [ ] **Step 4: Ensure theme.css exists for Storybook**

Run: `npm run build:tokens`
Expected: `dist/theme.css` present (preview.tsx imports it).

- [ ] **Step 5: Build Storybook to verify it compiles**

Run: `npm run build-storybook`
Expected: build succeeds; `storybook-static/` produced with no errors.

- [ ] **Step 6: Commit**

```bash
git add .storybook src/icons/Icons.stories.tsx
git commit -m "chore: add Storybook with dark/light theme decorator"
```

---

## Task 16: Playwright + axe-core e2e smoke test

**Files:**

- Create: `playwright.config.ts`
- Create: `e2e/foundations.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:6006',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run storybook -- --ci --quiet',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Install the Playwright browser**

Run: `npx playwright install chromium`
Expected: Chromium downloaded.

- [ ] **Step 3: Write the a11y smoke test `e2e/foundations.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const STORY_URL = '/iframe.html?id=foundations-icons--gallery&viewMode=story';

for (const theme of ['dark', 'light'] as const) {
  test(`icon gallery has no axe violations (${theme})`, async ({ page }) => {
    await page.goto(`${STORY_URL}&globals=theme:${theme}`);
    await page.locator('svg').first().waitFor();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
```

- [ ] **Step 4: Run the e2e test**

Run: `npm run test:e2e`
Expected: Playwright auto-starts Storybook, runs 2 tests (dark + light), both PASS with zero axe violations.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e/foundations.spec.ts
git commit -m "test: add Playwright + axe-core e2e smoke test"
```

---

## Task 17: README + final verification

**Files:**

- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# @koduhai/design-system (v1 — custom build)

Koduh AI's design system, rebuilt from scratch without Material UI. Dark-first
theme via CSS custom properties, zero-runtime CSS Modules styling, and a small
set of accessible primitives and icons.

> **Status:** Phase 0 (foundations) complete — tokens, primitives, icon set,
> theme provider, and the full build/test/Storybook pipeline are in place.
> Components are being added in Phases 1–4 (see `docs/superpowers/plans`).

## Develop

\`\`\`bash
npm install
npm run storybook # dev docs at http://localhost:6006
npm test # unit tests (Vitest)
npm run test:e2e # a11y/visual e2e (Playwright + axe)
npm run build # generate theme.css + bundle (tsup)
\`\`\`

## Architecture

- `src/theme` — design tokens (single source of truth) → `dist/theme.css`
- `src/primitives` — `Slot`, `VisuallyHidden`, `useId`, `useControllableState`, ref/handler utils
- `src/icons` — vendored SVG icon set + `createIcon` factory
- `src/provider` — `KoduhThemeProvider` + `useColorMode`

See `docs/superpowers/specs/2026-05-21-custom-design-system-design.md` for the full spec.
```

- [ ] **Step 2: Run the complete verification gate**

Run each and confirm the expected result before proceeding:

```bash
npm run typecheck     # Expected: PASS, no errors
npm run lint          # Expected: PASS, no errors
npm test              # Expected: PASS, all unit suites green
npm run build         # Expected: dist/ produced (js/mjs/d.ts/index.css/theme.css)
npm run test:e2e      # Expected: 2 a11y tests pass (dark + light)
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README documenting Phase 0 foundations"
```

- [ ] **Step 4: Final phase commit / tag (optional)**

```bash
git tag phase-0-complete
```

---

## Self-Review Notes (spec coverage)

- **§4 Architecture layers** → tokens (Task 2), primitives (Tasks 5–10), provider (Task 12), entry (Task 13).
- **§5 Tokens & theming** → Tasks 2, 3, 12 (dark default, light override, localStorage persistence, `data-theme`).
- **§5a Icons** → Task 11 (vendored SVG set, `createIcon`, `ReactNode` icon props, `/icons` export in Task 1).
- **§6 Primitives** → Tasks 5–10 (no Portal/FocusTrap, as designed).
- **§9 Accessibility** → axe-core enforced (Task 16); `:focus-visible` + reduced-motion in reset (Task 4).
- **§10 Testing** → Vitest (Tasks 2–13), Playwright + axe (Task 16); visual snapshots begin with components in Phase 1.
- **§11 Build & packaging** → exports map (Task 1), tsup + CSS extraction (Task 14), theme.css generation (Task 3).
- **§12 Storybook** → Task 15 (theme decorator, addon-a11y).
- **Risk #1 (CSS extraction)** → explicitly validated in Task 14 with a documented fallback.

**Out of scope for this plan (later phases):** the 12 components, `MIGRATION.md`, CI workflow, and visual-snapshot baselines — each follows in its phase plan using the patterns established here.

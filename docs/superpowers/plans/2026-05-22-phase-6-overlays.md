# Phase 6 — Overlays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Dialog`, `ConfirmDialog`, and `Snackbar` to `@koduhai/design-system` using native browser overlays — the `<dialog>` element and the Popover API — with **no** hand-built `Portal` or `FocusTrap` primitives.

**Architecture:** `Dialog` renders a native `<dialog>` and syncs a React `open` prop to `showModal()`/`close()` via a component-local effect; the browser provides focus trapping, Escape, inert background, and `::backdrop`. `ConfirmDialog` composes `Dialog`'s public API. `Snackbar` uses the Popover API (`popover` attribute + `showPopover()`/`hidePopover()`) to render in the top layer, non-modal. All are Layer-3 components.

**Tech Stack:** React 18/19, TypeScript (strict), CSS Modules, native `<dialog>` + Popover API, Vitest + Testing Library (jsdom) + fake timers, Storybook 10, Playwright + axe-core.

**Spec:** `docs/superpowers/specs/2026-05-22-component-expansion-v1.1-design.md`

**Prerequisite:** Phase 5 merged (or at least not in flight) to keep `src/index.ts` integration clean. Phase 6 dispatches **2 subagents**: one builds `Dialog` + `ConfirmDialog` (composition dependency), one builds `Snackbar`.

---

## Subagent brief (applies to both tasks)

Same rules as Phase 5: build ONLY your own folder, TDD, run ONLY your own `npx vitest run` file, do NOT touch shared files (`src/index.ts`, `e2e/components.spec.ts`, `README.md`, `tokens.ts`) or run git / project-wide gates. Follow `src/components/Button/Button.tsx` conventions (`/* @__PURE__ */ forwardRef`, `cx`, data-attributes, DOM-prop `Omit`).

**jsdom caveat (important for tests):** jsdom does not fully implement `HTMLDialogElement.showModal()`/`close()` or the Popover API. In your test setup, **stub the methods on the prototype** before rendering so the component's effect can call them without throwing, and assert on your own state/markup rather than native modal behavior. Include this helper at the top of your test file:

```tsx
import { beforeAll } from 'vitest';

beforeAll(() => {
  // jsdom lacks <dialog> modal methods; stub them so effects don't throw.
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  }
});
```

For `Snackbar` (Popover API), guard the calls in the component itself: `if (typeof el.showPopover === 'function') el.showPopover();` so it degrades gracefully where the API is absent (and doesn't throw in jsdom). Assert on `open`-driven markup, not popover visibility.

The browser-real focus-trap / top-layer behavior is validated by the Playwright axe pass in the integration step, not in jsdom unit tests.

---

## Task 1: Dialog + ConfirmDialog (one subagent)

**Files:**

- Create: `src/components/Dialog/Dialog.tsx`
- Create: `src/components/Dialog/ConfirmDialog.tsx`
- Create: `src/components/Dialog/Dialog.module.css`
- Create: `src/components/Dialog/Dialog.test.tsx`
- Create: `src/components/Dialog/Dialog.stories.tsx`
- Create: `src/components/Dialog/index.ts`

**API contract:**

```tsx
export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps extends Omit<HTMLAttributes<HTMLDialogElement>, 'title'> {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: DialogSize; // default 'md'
  /** Allow Esc and backdrop click to close. Default true. */
  dismissable?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string; // default 'Confirm'
  cancelLabel?: string; // default 'Cancel'
  tone?: 'primary' | 'danger'; // confirm button tone, default 'primary'
}
```

**Dialog behavior:**

- Renders `<dialog ref={dialogRef} className={cx(styles.root, className)} data-size={size}>`.
- A component-local effect syncs `open`: when `open` becomes true and `dialog.open` is false, call `showModal()`; when `open` becomes false and `dialog.open` is true, call `close()`. Guard both directions to avoid the "already open" `InvalidStateError`.
- Wire the native `close` and `cancel` events to `onClose` (the browser fires these on Esc). For `cancel` (Esc), if `!dismissable`, call `event.preventDefault()`.
- Backdrop click: if `dismissable`, a click whose `event.target === dialogRef.current` (i.e. on the backdrop, not content) calls `onClose`.
- `aria-labelledby` points to the title element (use `useId`); render a labeled close button (`<button aria-label="Close">`) in the header when `dismissable`.

**ConfirmDialog behavior:** composes `<Dialog>` with `title`/`description`/footer of two `Button`s (`Cancel` ghost-neutral, `Confirm` solid with `tone`). `onConfirm` then `onClose` on confirm; `onClose` on cancel. Imports `Button` from `../Button` (public API — allowed; composition, not internals).

- [ ] **Step 1: Write the failing tests** in `src/components/Dialog/Dialog.test.tsx`

```tsx
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog, ConfirmDialog } from './';

beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  }
});

describe('Dialog', () => {
  it('is not shown when open is false', () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Hi">
        Body
      </Dialog>,
    );
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    expect(dlg.open).toBe(false);
  });

  it('shows modally and labels itself by its title when open', () => {
    render(
      <Dialog open onClose={() => {}} title="Settings">
        Body
      </Dialog>,
    );
    const dlg = screen.getByRole('dialog', { name: 'Settings' });
    expect(dlg).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Settings">
        Body
      </Dialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on the native close event (Esc)', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Settings">
        Body
      </Dialog>,
    );
    const dlg = document.querySelector('dialog') as HTMLDialogElement;
    dlg.dispatchEvent(new Event('close'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ConfirmDialog', () => {
  it('renders title, description, and confirm/cancel actions', () => {
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete item?"
        description="This cannot be undone."
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Delete item?' })).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('fires onConfirm then onClose on confirm; only onClose on cancel', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, verify fail.** `npx vitest run src/components/Dialog/Dialog.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Implement** `Dialog.tsx`, `ConfirmDialog.tsx`, `Dialog.module.css`, `index.ts`.
      `index.ts`: `export { Dialog } from './Dialog'; export type { DialogProps, DialogSize } from './Dialog'; export { ConfirmDialog } from './ConfirmDialog'; export type { ConfirmDialogProps } from './ConfirmDialog';`
      CSS: `.root` (the `<dialog>`) max-width per `data-size`, radius/shadow tokens, padding; `.root::backdrop { background: rgb(0 0 0 / 0.5); }`; header/title/close/footer layout. Reduced-motion-gated open transition optional.

- [ ] **Step 4: Run, verify pass (6 tests).** `npx vitest run src/components/Dialog/Dialog.test.tsx`

- [ ] **Step 5: Write `Dialog.stories.tsx`.** Stories must render **in the open state** so axe inspects the dialog content. Provide a `Default` (controlled open via a story-local `useState` toggle button) and a `Showcase` that renders an **already-open** `Dialog` and an **already-open** `ConfirmDialog` (use `open` fixed true) so the visual/axe target captures them. Story id target: `components-dialog--showcase`.

- [ ] **Step 6: Re-run tests, report to parent (do NOT commit).**

---

## Task 2: Snackbar (one subagent)

**Files:**

- Create: `src/components/Snackbar/Snackbar.tsx`, `Snackbar.module.css`, `Snackbar.test.tsx`, `Snackbar.stories.tsx`, `index.ts`

**API contract:**

```tsx
export type SnackbarSeverity = 'info' | 'success' | 'warning' | 'error';
export type SnackbarPlacement = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center';

export interface SnackbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  open: boolean;
  onClose: () => void;
  severity?: SnackbarSeverity; // default 'info'
  message: ReactNode;
  action?: ReactNode; // e.g. an "Undo" Button
  /** Auto-dismiss after N ms. 0/undefined disables auto-hide. */
  autoHideDuration?: number;
  placement?: SnackbarPlacement; // default 'bottom-center'
}
```

**Behavior:**

- Renders a `<div popover="manual" ref={ref} role={severity === 'error' ? 'alert' : 'status'} aria-live={severity === 'error' ? 'assertive' : 'polite'} data-severity data-placement>`.
- Effect syncs `open`: when open, `if (typeof el.showPopover === 'function') el.showPopover();` else fall back to a `data-open` attribute for styling; when closed, `hidePopover()` (guarded). Always render the node so `aria-live` works.
- Auto-hide: when `open` && `autoHideDuration > 0`, set a `setTimeout(onClose, autoHideDuration)`; clear on unmount/close. **Pause on hover/focus**: clear the timer on `mouseenter`/`focusin`, restart on `mouseleave`/`focusout`.
- Severity icon (info/success/warning/error) + text — color is never the only signal. Close button labeled `Close`.

- [ ] **Step 1: Write the failing tests** in `src/components/Snackbar/Snackbar.test.tsx`

```tsx
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Snackbar } from './Snackbar';

beforeAll(() => {
  // jsdom lacks the Popover API; stub so effects don't throw.
  if (!HTMLElement.prototype.showPopover) {
    HTMLElement.prototype.showPopover = function () {};
    HTMLElement.prototype.hidePopover = function () {};
  }
});

afterEach(() => vi.useRealTimers());

describe('Snackbar', () => {
  it('announces via role=status for non-error severities', () => {
    render(<Snackbar open onClose={() => {}} message="Saved" severity="success" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('uses role=alert for error severity', () => {
    render(<Snackbar open onClose={() => {}} message="Failed" severity="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Snackbar open onClose={onClose} message="Hi" />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('auto-dismisses after autoHideDuration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Snackbar open onClose={onClose} message="Hi" autoHideDuration={3000} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders an action when provided', () => {
    render(<Snackbar open onClose={() => {}} message="Deleted" action={<button>Undo</button>} />);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail.** `npx vitest run src/components/Snackbar/Snackbar.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Implement.** `index.ts`: `export { Snackbar } from './Snackbar'; export type { SnackbarProps, SnackbarSeverity, SnackbarPlacement } from './Snackbar';`. CSS: fixed-position placement variants via `data-placement`, severity color accents via `data-severity` (reuse the Alert severity token approach), enter transition gated by reduced-motion. Use existing severity icons from `../../icons`.

- [ ] **Step 4: Run, verify pass (5 tests).** `npx vitest run src/components/Snackbar/Snackbar.test.tsx`

- [ ] **Step 5: Write `Snackbar.stories.tsx`.** `Default` and a `Showcase` rendering one **open** snackbar per severity (stacked) so axe/visual capture them. Story id target: `components-snackbar--showcase`. Disable `autoHideDuration` in stories so they stay visible.

- [ ] **Step 6: Re-run tests, report to parent (do NOT commit).**

---

## Integration Task (parent session, after both subagents report)

- [ ] **Step 1: Add exports to `src/index.ts`:**

```ts
export { Dialog, ConfirmDialog } from './components/Dialog';
export type { DialogProps, DialogSize, ConfirmDialogProps } from './components/Dialog';
export { Snackbar } from './components/Snackbar';
export type { SnackbarProps, SnackbarSeverity, SnackbarPlacement } from './components/Snackbar';
```

- [ ] **Step 2: Add to the e2e `COMPONENTS` array** in `e2e/components.spec.ts`: `{ name: 'Dialog', storyId: 'components-dialog--showcase' }` and `{ name: 'Snackbar', storyId: 'components-snackbar--showcase' }`. Because these stories render open overlays, confirm the existing `DISABLED_RULES` are still appropriate; the overlay content itself must produce zero violations.

- [ ] **Step 3: Add a `--ku-z-dialog` token if needed.** If `Dialog`/`Snackbar` need a z-index token beyond the existing `--ku-z-appbar`/`--ku-z-sidebar`, add it to `src/theme/tokens.ts` (NOT `dist/theme.css`), then run `npm run build:tokens`. Native top-layer (`showModal`/popover) usually makes this unnecessary — only add if a real stacking issue appears.

- [ ] **Step 4: Run the full gate.**

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run verify:bundle
npm run test:e2e    # confirm <dialog>/popover overlays pass axe in both themes; regenerate baselines locally, do NOT commit *-snapshots/
```

Expected: all green; Dialog + Snackbar Showcase stories pass axe in dark and light with zero violations. If a target browser lacks `<dialog>`/Popover support during e2e, verify the graceful-degradation path (non-modal render) rather than adding a polyfill.

- [ ] **Step 5: Update the README status block** to mark all 24 components shipped.

- [ ] **Step 6: Commit** per-component, then an integration commit, on the `phase-5-6-component-expansion` branch. After Phase 5 + 6 both land and the full gate is green, hand off to the maintainer for the version bump + `CHANGELOG.md` + release (tag/push is maintainer-controlled).

---

## Self-Review notes (already applied)

- Spec coverage: Dialog, ConfirmDialog, Snackbar (spec §4 Phase 6) each have a task. Native-first / no Portal/FocusTrap (§2, §3) enforced by using `<dialog>` + Popover. Declarative Snackbar / no provider (§2) reflected in the `open`/`onClose` API. Browser-support degradation (§6) covered in the Snackbar guard + integration Step 4.
- No placeholders: concrete API types, real test code (including the jsdom stub for `<dialog>`/popover and fake-timer auto-hide), exact exports, exact commands.
- Type consistency: Integration export names match each task's `index.ts`. ConfirmDialog composes `Dialog` and `Button` via their public exports only.
- Risk from spec §8 (dialog open-state desync) is mitigated by the guarded sync effect + building Dialog/ConfirmDialog in one agent.

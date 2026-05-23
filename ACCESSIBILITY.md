# Accessibility

`@koduhai/design-system` targets **WCAG 2.1 AA** as a hard requirement.

## Automated coverage

- **axe-core** runs against every component's Showcase story in **both dark and
  light themes** via Playwright (`e2e/components.spec.ts`) — currently **zero
  violations** across all 12 components plus the icon gallery.
- Document-structure rules that don't apply to isolated story fragments
  (`landmark-one-main`, `page-has-heading-one`, `region`) are disabled per-test
  with documented justification; component-level rules (contrast, names, roles,
  landmark uniqueness) are always enforced.
- Type safety (`tsc --noEmit`) and unit tests assert ARIA wiring
  (`aria-describedby`, `aria-current`, `aria-expanded`, `aria-invalid`, roles).

## Principles enforced

- **Color is never the only signal.** StatusBadge pairs color with a text label
  and dot; Alert pairs color with an icon and role; the Sidebar active item uses
  high-contrast text + a primary accent bar + weight (not color alone).
- **Visible focus.** `reset.css` provides a `:focus-visible` ring; no component
  removes outlines without replacement.
- **Reduced motion.** `prefers-reduced-motion` is honored in the reset; the only
  animation (the LoadingButton spinner) is decorative and `aria-hidden`.
- **Keyboard operable.** All interactive elements are native `<button>`/`<a>`/
  `<input>` (or `asChild` preserving the correct role); nothing relies on
  pointer-only interaction.

## Per-component notes

| Component              | Key a11y measures                                                                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button / LoadingButton | native `<button>`; `asChild` keeps the link role; `aria-busy` + disabled while loading; screen-reader-only loading text                                                                              |
| Chip                   | a clickable chip is a `<button>`; the delete affordance is a labeled button                                                                                                                          |
| Avatar                 | `alt` on the image; initials fallback gets an `aria-label`                                                                                                                                           |
| StatusBadge            | a text label is always present; color + dot are secondary signals                                                                                                                                    |
| Alert                  | `role="alert"` (error/warning) or `role="status"` (info/success); labeled close button                                                                                                               |
| TextField              | label↔input linked via `useId`; helper/error text via `aria-describedby`; `aria-invalid` on error; `required` reflected                                                                              |
| Card                   | semantic container; heading structure left to the consumer                                                                                                                                           |
| EmptyState             | configurable heading level; decorative icon is `aria-hidden`                                                                                                                                         |
| PageHeader             | `<header>`; configurable heading level; breadcrumbs in `<nav aria-label="Breadcrumb">`                                                                                                               |
| AppBar                 | `<header>` banner landmark; keyboard-reachable actions                                                                                                                                               |
| Sidebar                | `<nav>` landmark; labeled collapse toggle (`aria-expanded`/`aria-controls`); active item `aria-current="page"`; collapsed labels stay in the accessibility tree (clip technique, not `display:none`) |

## Known limitations / out of scope

- No overlay components (Dialog, Snackbar, Tooltip) ship in v1, so there are no
  focus-trap or portal concerns. If overlays are added later, focus management
  must be designed in from the start.
- axe verifies contrast on the Showcase stories with the shipped tokens. Bespoke
  consumer color overrides are the consumer's responsibility to re-check.

## Running the audit locally

```bash
npm run test:e2e -- --grep axe   # axe on every component, both themes
```

# Capability Map: UI/UX Remediation

Scope: presentation layer only. `lib/parser/` and `lib/engine/` are not modified —
where a finding is "this computed value is never shown", the fix is in the component.

The product spec in [`SPEC.md`](SPEC.md) remains authoritative for objective, engine
rules, and buy-window thresholds. This map and its module specs cover how that
product is presented.

## Modules

| Module id | Responsibility | Depends on |
|---|---|---|
| `design-tokens` | Semantic status tokens, chart hues, container centering. `app/globals.css` | — |
| `app-shell` | Page composition, `h1`, visual grouping, banner demotion, risk disclaimer, footer | `design-tokens` |
| `data-presentation` | Brutalist alignment of the 6 feature components, status styling, sort carets, confidence/price/DPS, today marker | `design-tokens` |
| `a11y-semantics` | Heading hierarchy, label associations, aria across both surfaces | `app-shell`, `data-presentation` |

Build order: `design-tokens` → (`app-shell`, `data-presentation`) → `a11y-semantics`

## Design direction

The primitives in `components/ui/` encode a brutalist/terminal system — `rounded-none`,
`uppercase tracking-widest`, `ring-1 ring-foreground/5` in place of borders,
`--card-spacing`. The feature components currently ignore it and use stock shadcn
idiom (`rounded-lg`, `shadow-sm`, `border`). **Feature components align to the
primitives; `components/ui/` is not modified.**

Two consequences, accepted deliberately:

- Every `Badge` variant is `bg-transparent border-0 px-0`, so filled status pills are
  out of scope. Status reads through a semantic-token icon and hairline rule, with the
  label in `--foreground`.
- `Card` exposes no `render`/`as` prop and `CardTitle` renders a `div`, so
  `StatsOverview` renders its own heading element rather than relying on `CardTitle`.

Dark mode stays system-driven; no theme toggle was requested. Because the user cannot
switch away from a broken theme, **both themes must pass contrast** — this is a gate,
not a preference.

## Finding allocation

```
design-tokens      container centering · --success/--warning/--danger
                   · chart-1..3 real hue (root cause of the contrast failures)
app-shell          h1 · success-banner squatting above the fold
                   · flat space-y-6 grouping · risk disclaimer · footer
data-presentation  design-language split · status color application
                   · sort carets · historicalConsistency + currentPrice
                   + estimatedDividendPerShare · stale toast · today marker
                   · jammed ticker list · unified empty state
                   · Dropzone.test.tsx → *.spec.tsx convention
a11y-semantics     heading hierarchy · FilterBar htmlFor · search input label
```

## Verification bar

Shared by every module:

```bash
pnpm test    # extends the existing *.spec.tsx suites
pnpm lint
pnpm build
```

Contrast is verified by computation against both theme backgrounds, parsed from the
shipped `app/globals.css` so the assertion cannot drift from the stylesheet. Text
tokens meet WCAG AA 4.5:1 (SC 1.4.3); non-text fills meet 3:1 (SC 1.4.11).

No new runtime or dev dependencies. Charts stay CSS/SVG.

## Module specs

Written just-in-time, in dependency order, each gated on review before implementation:

- [`SPEC-design-tokens.md`](SPEC-design-tokens.md)
- `SPEC-app-shell.md` — not yet written
- `SPEC-data-presentation.md` — not yet written
- `SPEC-a11y-semantics.md` — not yet written

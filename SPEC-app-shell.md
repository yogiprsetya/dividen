# SPEC: `app-shell`

Module 2 of [`UI-CAPABILITY-MAP.md`](UI-CAPABILITY-MAP.md). Depends on `design-tokens`
(landed). Runs in parallel with `data-presentation`; `a11y-semantics` depends on both.

## Objective

Give the page a shape. Today `app/page.tsx` is one flat `space-y-6` stack with no
heading, no grouping, and no warning that every number on it is a projection:

1. **No `h1`.** `CardTitle` renders a `div` and the header wordmark is a `<span>`, so
   the document has no top-level heading at all.
2. **The loaded-state banner squats above the fold.** Once data loads, `Dropzone`
   renders a permanent "Data Loaded Successfully" block (`components/Dropzone.tsx`
   `currentData` branch) above `StatsOverview`. It is a one-time confirmation that
   never goes away and pushes the results down.
3. **No grouping.** Stats, controls, table and chart are visually equidistant.
4. **No risk disclaimer.** The tool's whole output is a projected cum-date and yield.

Success: a user lands on a page with one clear title, sees results first once data is
loaded, and is told on the same screen that the figures are estimates.

## Tech Stack

No change. No new dependencies.

## Commands

```bash
pnpm test
pnpm lint
pnpm build
pnpm dev     # visual check at 360 / 768 / 1440
```

## Project Structure

```
app/page.tsx         → h1, grouping, disclaimer, banner position (modified)
app/page.spec.tsx    → assertions for the above (modified)
app/layout.tsx       → footer only if changed below; it is not (unchanged)
```

`components/Dropzone.tsx` is **not** touched by this module (see Ownership boundary).

## Decisions

### 1. Heading placement — `h1` lives in `app/page.tsx`

- Text: **"Dividend Capture Radar"**. Deliberately not "Radar Dividend": the header
  wordmark keeps that name and the `h1` must not duplicate it.
- Rendered as the first child of the page, above everything else, in both the empty
  and loaded states.
- Styled in the primitives' vocabulary: `text-xl font-semibold uppercase
  tracking-widest`. Visible, not `sr-only`.
- The header wordmark stays a `<span>`. The `h1` is page content, and `layout.tsx`
  wraps every future page.

Heading order for a11y-semantics: `h1` (page) → `h2` (StatsOverview) → `h2`
(SeasonalityChart). The shell adds only the `h1`.

### 2. Risk disclaimer — copy and placement

Copy (exact):

> Projected dates and yields are estimates from historical dividend patterns, not
> financial advice. Past dividends do not guarantee future payments. Verify with
> official IDX announcements before trading.

Placement: a single `<p>` directly under the `h1`, `text-xs text-muted-foreground`,
rendered **only when `parseResult` is non-null** ("whenever data is loaded"). Under the
`h1`, not under the table, so it is on screen with the first results regardless of
table length.

### 3. Loaded-state banner — structural position

The loaded-state block moves from the top of the page to the **bottom of the results**,
after `SeasonalityChart`, as its own "data source" group. It is no longer the first
thing a loaded user sees.

Structural move only: `page.tsx` keeps rendering `<Dropzone>` once, but renders it in a
different place depending on state:

- **No data:** `Dropzone` at the top, under the `h1` (empty/upload state is the
  content).
- **Data loaded:** results first; `Dropzone` after them.

Known trade-off, accepted: parse-warning diagnostics and the **Clear Data** button live
in the same block, so they also move to the bottom. If review rejects that, the
alternative is to leave `Dropzone` in place and have `data-presentation` shrink it to a
single-line strip. Flagged as Open Question 1.

### 4. Grouping

Replace the flat `space-y-6` with three groups, `space-y-10` between groups and
`space-y-4` within:

1. **Summary** — `StatsOverview`
2. **Radar** — `FilterBar`, `WatchlistExport`, `RadarTable`
3. **Seasonality** — `SeasonalityChart`

then the data-source group (`Dropzone`, loaded). Groups are plain `div`s. No landmark
roles or `aria-*`: that is `a11y-semantics`.

### 5. Footer — unchanged

Content and markup in `app/layout.tsx` stay as they are.

## Ownership boundary

Shared with [`data-presentation`](UI-CAPABILITY-MAP.md), stated once:

- `app-shell` decides the **structural position** of the loaded-state indicator.
- `data-presentation`'s Dropzone task restyles only its **visual treatment** (hardcoded
  `text-green-500`, `rounded-xl`, test location) and does not re-architect position.
- The unified empty-state message (cross-phase join task) is `app/page.tsx` work and is
  sequenced after both modules.

## Code Style

```tsx
<div className="space-y-10">
  <h1 className="text-xl font-semibold uppercase tracking-widest">
    Dividend Capture Radar
  </h1>
  {parseResult && (
    <p className="text-xs text-muted-foreground">{RISK_DISCLAIMER}</p>
  )}
  ...
</div>
```

`RISK_DISCLAIMER` is a module-level constant in `page.tsx`, not exported.

## Testing Strategy

Extend `app/page.spec.tsx` (Testing Library, existing helper `loadDemo`):

- `h1` with name "Dividend Capture Radar" exists before data and after data.
- Exactly one `h1` in the document.
- Disclaimer text absent before data; present after loading demo data.
- Loaded-state banner ("Data Loaded Successfully") appears **after** the
  seasonality heading in DOM order (`compareDocumentPosition`), and the upload prompt
  appears before any results when empty.
- Existing four tests still pass unchanged.

Not covered: visual spacing (manual, 360/768/1440).

## Boundaries

**Always**
- Keep the move structural; leave `Dropzone` internals alone.
- Render the disclaimer only when data is loaded.

**Ask first**
- Changing the disclaimer copy after approval.
- Any `layout.tsx` edit.

**Never**
- Modify `components/ui/`, `lib/parser/`, `lib/engine/`.
- Add `aria-*` or landmark roles (a11y-semantics).
- Restyle `Dropzone` here.

## Success Criteria

1. One `h1` "Dividend Capture Radar" in both states.
2. Disclaimer, with the exact copy above, visible iff data is loaded.
3. Loaded-state banner renders after the seasonality chart; empty state unchanged in
   effect.
4. Three result groups plus data-source group, spacing per Decision 4.
5. Footer content unchanged.
6. `pnpm test && pnpm lint && pnpm build` clean; `git diff --stat` touches only
   `app/page.tsx` and `app/page.spec.tsx`.

These match the acceptance criteria of the implementation task (#20).

## Open Questions

1. **Banner at the bottom, or a one-line strip at the top?** Bottom (this spec) buries
   Clear Data and parse warnings. Strip keeps them reachable but needs Dropzone changes
   owned by data-presentation.
2. **Disclaimer under the `h1` or under the table?** Chosen: under the `h1` so it is
   always on screen with results.
3. **`h1` text.** "Dividend Capture Radar" is proposed; confirm.

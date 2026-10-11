# SPEC: `data-presentation`

Module 3 of [`UI-CAPABILITY-MAP.md`](UI-CAPABILITY-MAP.md). Depends on `design-tokens`
(landed). Runs in parallel with `app-shell`; `a11y-semantics` depends on both.

## Objective

Bring the six feature components in line with the brutalist primitives in
`components/ui/`, and fix three presentation gaps:

1. **Three computed fields are never shown.** `RadarOpportunity.historicalConsistency`,
   `currentPrice` and `estimatedDividendPerShare` exist on the type but
   `components/RadarTable.tsx` renders none of them.
2. **`WatchlistExport` toast never clears.** `setMessage` (`WatchlistExport.tsx:12,20`)
   is never reset, so "Copied 5 tickers" stays after the filters change.
3. **Design-language split.** Feature components use `rounded-lg border shadow-sm` and
   Tailwind palette colors; the primitives use `rounded-none`, `ring-1`, and semantic tokens.

Success: every item above is fixed, and a grep (Decision 4) proves no stock-shadcn idiom
remains in the six components.

## Commands

```bash
pnpm test
pnpm lint
pnpm build
```

## Decisions

### 1. Placement of the three new `RadarTable` fields

All three are visible **without expanding** a row. `HistoryDetails` is not used for
them, because it is collapsed by default and the fields are first-order inputs to the buy
decision.

**Desktop table: add three columns.** The wrapper is already `overflow-x-auto`, so width
is absorbed by scroll. New column order (9 columns):

| # | Header | Cell | Sortable |
|---|---|---|---|
| 1 | Symbol | unchanged | yes |
| 2 | Status | unchanged | no |
| 3 | **Price** | `formatCurrency(opp.currentPrice)` | no |
| 4 | Est. Cum Date | unchanged | no |
| 5 | Days to Cum Date | unchanged | yes |
| 6 | **Est. DPS** | `formatCurrency(opp.estimatedDividendPerShare)` | no |
| 7 | Est. Yield | unchanged | yes |
| 8 | **Consistency** | `${Math.round(opp.historicalConsistency)}/100` | no |
| 9 | Historical Payouts | unchanged | no |

The expanded history row's `colSpan` changes from `6` to `9`.

Rationale for the order: price, then DPS, then yield keeps the arithmetic
(`DPS / price = yield`) readable left to right; consistency sits next to the history
toggle it summarizes.

No new sort keys. `FilterOptions["sortBy"]` and `lib/engine/` are not touched.

**Mobile card: grow the grid to two rows of three.** `dl` stays `grid-cols-3`; the three
existing cells keep row 1, the new cells fill row 2. Nothing is displaced.

| Row 1 | Est. Cum Date | Days | Est. Yield |
|---|---|---|---|
| **Row 2** | **Price** | **Est. DPS** | **Consistency** |

Labels in the mobile cards are `Price`, `Est. DPS`, `Consistency`; values formatted as in
the desktop table (Cum Date keeps `shortMonth`).

### 2. `WatchlistExport` toast-clear mechanism

**Timeout.** After `setMessage(...)` is called with a non-empty message, a `3000` ms timer
clears it. Both outcomes (success and "Could not copy to clipboard") clear the same way.

- Implementation: `useEffect` keyed on `message`; when non-empty, `setTimeout(() => setMessage(""), 3000)`, cleanup clears the timeout. A new message therefore restarts the
  timer, and unmount cancels it.
- The duration is a module-level constant, not exported.
- The `role="status"` `<p>` stays mounted (so assistive tech announces later changes);
  only its text empties.

Rejected: clear-on-`opportunities`-change (leaves the message up forever if the user
does nothing) and clear-on-interaction (needs a global listener, more code, and the
message could vanish before it is read).

Test: with `vi.useFakeTimers()`, click Copy Tickers, assert the message, advance 3000 ms,
assert the status element is empty.

### 3. `Dropzone` — visual only

Confirmed: this module restyles `Dropzone`'s **visual treatment only**. Per the
ownership boundary in [`SPEC-app-shell.md`](SPEC-app-shell.md), `app-shell` owns the
loaded-state banner's position; `Dropzone` internals are not re-architected here.

In scope: replace `text-green-500` (line 89) with `text-success`; replace `rounded-lg` /
`rounded-xl` / `rounded-full` with the primitives' `rounded-none`; no behavior change.
Also move `test/components/Dropzone.test.tsx` → `components/Dropzone.spec.tsx` (imports
updated, no assertion changes).

### 4. Mechanical restyle check

"Brutalist vocabulary applied" means this command returns **nothing**:

```bash
grep -nE "rounded-(sm|md|lg|xl|2xl|3xl|full)|shadow(-[a-z0-9]+)?\b|(text|bg|border|fill|stroke)-(red|green|yellow|blue|amber|orange|emerald|slate|gray|zinc|neutral)-[0-9]+" \
  components/{RadarTable,FilterBar,StatsOverview,SeasonalityChart,WatchlistExport,Dropzone}.tsx
```

At the time of writing it matches `Dropzone.tsx` (87, 89, 130, 143), `RadarTable.tsx`
(19–21, 121, 129, 194) and `FilterBar.tsx` (81). Per-task greps in the issues are subsets
of this one.

Replacements:

| Was | Becomes |
|---|---|
| `rounded-lg border` / `rounded-xl border` | `ring-1 ring-foreground/5` (no radius) |
| `shadow-sm` | removed |
| `text-green-600` / `text-yellow-600` / `text-red-600` | `text-success` / `text-warning` / `text-danger` |
| `text-green-500` | `text-success` |

Status labels stay `--foreground` per the capability map; only the icon carries the
semantic color, so the `className` in `STATUS_DISPLAY` is applied to the icon, not the
label text. `OFF_CYCLE` keeps `text-muted-foreground`.

Not caught by grep, checked in review: uppercase/tracking on headings and table headers
match the primitives (`uppercase tracking-widest` on `th`, `text-xs`).

## Per-component scope

| Component | Task | Change |
|---|---|---|
| `RadarTable` | #23 | tokens, radius/shadow removal, sort carets |
| `RadarTable` | #24 | three new fields (Decision 1) |
| `Dropzone` | #26 | Decision 3 |
| `FilterBar` | #27 | restyle only; `htmlFor` is `a11y-semantics` |
| `WatchlistExport` | #28 | restyle + Decision 2 |
| `StatsOverview` | #29 | restyle + explicit `totalTracked === 0` branch; heading element is `a11y-semantics` |
| `SeasonalityChart` | #25 | `--chart-1`/`--chart-2`, current-month marker, ticker spacing |

### Sort carets (#23)

`sortHeader` renders a lucide `ArrowUp` / `ArrowDown` (`aria-hidden`) inside the button
only for the active column; direction follows `sortDirection` (`asc` → up, `desc` →
down). Inactive columns render none. `aria-sort` on the `th` is unchanged.

### Today marker (#25)

The bar for the current month (`new Date().getMonth() + 1`) gets a visible marker: a
`border-b-2 border-foreground` on that month's label plus a `Today` text hint in the
legend. Not color alone. The month comes from a single `new Date()` read inside the
component; the test mocks it with `vi.setSystemTime`.

### Ticker list (#25)

Tickers render as a `flex flex-wrap gap-x-3 gap-y-1` list with a leading `·` separator
between items (not before the first). Replaces `gap-x-1` with no separators.

### StatsOverview empty state (#29)

When `stats.totalTracked === 0`, render a single line "No data loaded" in place of the
zeros and `N/A` values. The loaded branch is unchanged. The unified, page-level empty
message is #30, not this task.

## Code Style

```tsx
<div className="hidden md:block ring-1 ring-foreground/5 overflow-x-auto">
  <table className="w-full text-sm">
    <thead className="bg-muted/50 text-left">
```

Match existing style; no new abstractions. Extract nothing the three call sites don't
share.

## Testing Strategy

Colocated `*.spec.tsx`, Testing Library, as the existing suites do.

- `RadarTable.spec.tsx`: for a known fixture, price, DPS and `NN/100` appear in the
  desktop table and in `data-testid="radar-cards"`; caret direction flips on header
  click and matches `aria-sort`.
- `WatchlistExport.spec.tsx`: fake-timer test from Decision 2.
- `SeasonalityChart.spec.tsx`: marker present on the current month only.
- `StatsOverview.spec.tsx`: empty-state branch renders at `totalTracked === 0`.
- `Dropzone.spec.tsx`: moved file passes unchanged.
- `FilterBar.spec.tsx`: must pass **unchanged**.

Not covered: visual spacing and contrast (manual at 360/768/1440, both themes).

## Boundaries

**Always**
- Keep `components/ui/`, `lib/parser/`, `lib/engine/` untouched.
- Run the Decision 4 grep before handing a task over.

**Ask first**
- Adding a sort key for the new columns.
- Changing the 3000 ms toast duration.

**Never**
- Add `htmlFor`, `aria-*` or heading elements (that is `a11y-semantics`).
- Move the loaded-state banner (that is `app-shell`).
- Add dependencies.

## Success Criteria

1. Price, Est. DPS and Consistency render in both the desktop table and the mobile cards,
   without expanding a row, in the positions of Decision 1.
2. The toast clears 3000 ms after it is set.
3. The Decision 4 grep returns nothing.
4. Sort carets show the active column and direction.
5. `Dropzone.spec.tsx` lives in `components/`; `test/components/Dropzone.test.tsx` is gone.
6. `pnpm test && pnpm lint && pnpm build` clean.

## Open Questions

1. **Nine desktop columns** is wide; it relies on horizontal scroll below ~1200px. The
   alternative is to fold Price under the ticker cell as a sub-line. Chosen: separate
   columns, for scanability.
2. **Consistency as `NN/100`.** The type says "0-100 score", not a percent, so `%` is
   avoided. Confirm wording.
3. **Toast duration** of 3000 ms.

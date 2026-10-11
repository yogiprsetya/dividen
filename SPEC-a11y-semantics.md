# SPEC: `a11y-semantics`

Module 4 of [`UI-CAPABILITY-MAP.md`](UI-CAPABILITY-MAP.md). Depends on `app-shell`
(landed: `h1` "Dividend Capture Radar" exists in `app/page.tsx`) and
`data-presentation` (landed: `SeasonalityChart` already renders
`<h2 id="seasonality-heading">`).

Short on purpose. The two hard calls are already made by the capability map: the `h1`
is placed, and `StatsOverview` must render its own heading because `CardTitle` is a
`div`. This spec only fixes the exact wording and ids so tasks #33 and #34 do not invent
them independently.

## 1. Heading hierarchy (task #33)

Target outline, no skipped levels:

```
h1  Dividend Capture Radar      (app/page.tsx, exists)
h2  Summary                     (StatsOverview, new)
h2  Seasonality                 (SeasonalityChart, exists; text unchanged)
```

`StatsOverview` renders **`<h2>` with the text "Summary"**, as the first child of its
populated branch (the `grid` wrapper becomes a `section`-free fragment or the heading
sits above the grid; implementer's choice, no new landmark). The four `CardTitle`
`div`s stay as they are and are not headings.

Visibility: `sr-only`. The summary cards already read as a group visually; a visible
"Summary" label would add chrome the design direction does not ask for. This is Open
Question 1.

The empty branch (`totalTracked === 0`, the "No data" `<p>`) renders no heading.

## 2. FilterBar labels (task #34)

`FilterBar.tsx` has three bare `<label>` elements (Minimum Yield, Accumulation Month,
Window Status) and an unlabeled search `Input`. Ids are fixed literals (one FilterBar
per page).

| Control | Label text (exact) | id | Association |
|---|---|---|---|
| Search `Input` | `Search ticker or company` | `filter-search` | `sr-only` `<label htmlFor="filter-search">`; placeholder stays as is |
| Minimum Yield `Slider` | `Minimum Yield` | `filter-min-yield` | `<label htmlFor="filter-min-yield">`; id forwarded to the slider thumb's input via `Slider.Thumb` `inputId` path, or `aria-labelledby` on `Slider` if the id cannot reach the input |
| Accumulation Month `SelectTrigger` | `Accumulation Month` | `filter-month` | `<label htmlFor="filter-month">`, id on `SelectTrigger` |
| Window Status `Tabs` | `Window Status` | `filter-status-label` | see below |

Existing visible label texts are unchanged, so no copy moves for sighted users.

**Window Status exception.** `htmlFor` only targets labelable elements (input, select,
button, ...). `TabsList` is a `div role="tablist"`, so `htmlFor` would point at nothing
valid. For this control the label becomes a `<span id="filter-status-label">` and
`TabsList` gets `aria-labelledby="filter-status-label"`. That deviates from the literal
"3 labels have `htmlFor`" in #34's criterion: two controls use `htmlFor`, one uses
`aria-labelledby`, and all three have a computed accessible name. Open Question 2.

## Testing strategy

Extend existing specs (Testing Library):

- `StatsOverview.spec.tsx`: `getByRole("heading", { level: 2, name: "Summary" })` when
  populated; no heading in the empty state.
- `app/page.spec.tsx`: after loading demo data, headings in DOM order are exactly
  h1 "Dividend Capture Radar", h2 "Summary", h2 "Seasonality" (levels never skip).
- `FilterBar.spec.tsx`: `getByLabelText` succeeds for `Search ticker or company`,
  `Minimum Yield`, `Accumulation Month`, and `getByRole("tablist", { name: "Window
  Status" })`.

Not covered by tests: that screen readers announce these as intended (manual).

## Boundaries

**Always**: keep visible text and layout unchanged; ids as in the table.
**Ask first**: changing label or heading wording; making the "Summary" heading visible.
**Never**: edit `components/ui/`, `lib/parser/`, `lib/engine/`; add dependencies; add
landmark roles beyond what already exists (`SeasonalityChart`'s `section`).

## Success criteria

1. Outline is h1 → h2 "Summary" → h2 "Seasonality", exactly one `h1`.
2. Every FilterBar control has a computed accessible name equal to the table's text.
3. `pnpm test && pnpm lint && pnpm build` clean; changes confined to `StatsOverview`,
   `FilterBar` and their specs (plus `app/page.spec.tsx`).

## Open questions

1. **"Summary" heading: `sr-only` or visible?** Spec chooses `sr-only`.
2. **Window Status via `aria-labelledby` instead of `htmlFor`.** Spec chooses it because
   a `tablist` is not labelable; confirm the deviation from #34's wording.
3. **Slider association path.** Whether `htmlFor`→thumb input is reachable through
   `components/ui/slider.tsx` (which is not to be modified) is unverified; #34 falls
   back to `aria-labelledby` on `Slider` if not.

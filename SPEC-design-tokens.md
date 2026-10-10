# SPEC: `design-tokens`

Module 1 of [`UI-CAPABILITY-MAP.md`](UI-CAPABILITY-MAP.md). Depends on nothing.
Everything downstream depends on this, so it lands first.

## Objective

Give the app a colour vocabulary that can express dividend status legibly in both
themes, and make page content centre on wide viewports. Today neither is possible:

1. **`container` no longer centres.** [`app/layout.tsx`](app/layout.tsx) uses
   `container` at three call sites (header, main, footer). Tailwind v4 removed the
   `center` option, so `container` now contributes only per-breakpoint `max-width` —
   no `margin-inline: auto`. Nothing restores it: `app/globals.css` has no
   `@utility container`, and `node_modules/shadcn/dist/tailwind.css` (637 lines) does
   not define one either. All page content sits left of a wide viewport.

2. **There is no correct colour to reach for.** `--chart-1` … `--chart-5` are a pure
   grayscale ramp (chroma 0.006–0.017), and no `--success` / `--warning` / `--danger`
   tokens exist. So `RadarTable` hardcodes Tailwind palette classes, and every one
   fails WCAG AA in one theme:

   | Current class | On light (`oklch(1 0 0)`) | On dark (`oklch(0.141 …)`) |
   |---|---|---|
   | `text-green-600` | **3.30:1 ✗** | 6.04:1 ✓ |
   | `text-yellow-600` | **2.94:1 ✗** | 6.77:1 ✓ |
   | `text-red-600` | 4.83:1 ✓ | **4.12:1 ✗** |

   Status is the primary signal in this product, rendered at `text-[0.625rem]` (10px)
   by the badge base — unambiguously normal text, so the 4.5:1 floor applies.

Success: a downstream component can write `text-success` and be correct in both
themes without thinking about it.

## Tech Stack

No change. Tailwind CSS v4, `@theme inline` token registration, oklch colour.
**No new dependencies** — the contrast check is hand-rolled oklch→sRGB→WCAG maths.

## Commands

```bash
pnpm dev          # visual check at 360 / 768 / 1440
pnpm test         # includes the new contrast spec
pnpm lint
pnpm build
```

## Project Structure

Files this module touches — nothing else:

```
app/globals.css              → token definitions (modified)
app/globals.spec.ts          → parses globals.css, asserts contrast (new)
test/helpers/contrast.ts     → oklch → sRGB → WCAG ratio (new)
app/layout.tsx               → container call sites, if option B is chosen (modified)
```

`test/helpers/contrast.ts` is test infrastructure, not app code — it is deliberately
outside `lib/` so it is never part of the client bundle. It is the only new module and
it has exactly one consumer, `app/globals.spec.ts`.

## Deliverables

### 1. Semantic status tokens

Added to `:root` and `.dark`, registered in `@theme inline` as `--color-success`,
`--color-warning`, `--color-danger`. Values below are **computed and verified**, not
estimated — chroma held low deliberately so they sit with the near-neutral zinc
palette instead of fighting it.

| Token | Light | ratio | Dark | ratio |
|---|---|---|---|---|
| `--success` | `oklch(0.52 0.12 150)` `#287c42` | 5.21:1 | `oklch(0.74 0.13 150)` `#69c27e` | 9.08:1 |
| `--warning` | `oklch(0.55 0.12 65)` `#a0600b` | 5.01:1 | `oklch(0.78 0.13 65)` `#f0a556` | 9.68:1 |
| `--danger` | `oklch(0.52 0.17 27.325)` `#b6322c` | 6.01:1 | `oklch(0.65 0.17 27.325)` `#e45d53` | 5.69:1 |

`OFF_CYCLE` keeps the existing `--muted-foreground`; no new token.

**Why `--warning` is amber-orange (hue 65) and not yellow (hue 85).** Yellow cannot
be made legible on white. Measured ceiling for hue 85 against `oklch(1 0 0)`:

```
C=0.14  max 2.87:1    C=0.12  max 4.22:1    C=0.10  max 6.37:1
```

Reaching 4.5:1 at hue 85 forces chroma ≤ 0.116, which lands on `#957000` — a muddy
olive that reads as "disabled", not "caution". Hue 65 reaches 5.01:1 at usable chroma
while still reading as amber. This is a real constraint, not a preference; `--warning`
will not look like the yellow in the current build.

### 2. Chart hues

`--chart-1` … `--chart-3` get real hue, per theme, at the 3:1 non-text floor:

| Token | Light | ratio | Dark | ratio | Consumer |
|---|---|---|---|---|---|
| `--chart-1` | `oklch(0.58 0.11 150)` `#448c56` | 4.08:1 | `oklch(0.72 0.12 150)` `#69ba7c` | 8.42:1 | buy-window bars |
| `--chart-2` | `oklch(0.6 0.12 65)` `#b16f23` | 4.07:1 | `oklch(0.76 0.12 65)` `#e5a059` | 9.04:1 | cum-date density |
| `--chart-3` | `oklch(0.55 0.05 285)` `#6e6e8e` | 4.91:1 | `oklch(0.7 0.04 285)` `#9b9bb7` | 7.39:1 | today marker |

`--chart-4` and `--chart-5` are **left untouched**. Nothing consumes them, and
inventing colours for absent consumers would violate the repo's "only export a symbol
if another file imports it" rule. Redefine them when a fourth series exists.

### 3. Container centring

Two options. **Option B is recommended.**

- **Option A — `@utility container`.** Idiomatic v4, one place. Carries a real
  unknown: whether `@utility container` *extends* the built-in utility or *replaces*
  it. If it replaces, declaring only `margin-inline: auto` silently drops every
  breakpoint `max-width` and the layout gets worse, not better. Resolvable only by
  checking computed style in a browser.
- **Option B — explicit utilities.** Replace `container` with
  `mx-auto w-full max-w-7xl` at the three call sites in `app/layout.tsx`. Three lines,
  no ambiguity, no dependence on container semantics. Existing `px-4 md:px-8` stays as
  is; the utility must not also set `padding-inline` or padding doubles up.

Option B is the surgical choice and is what this spec assumes. Flagged in Open
Questions because it is the one decision in this module that is reversible but worth
making consciously.

## Code Style

Tokens are declared raw in `:root` / `.dark`, then surfaced through `@theme inline` —
matching how every existing token in the file is wired:

```css
@theme inline {
  /* … existing … */
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
}

:root {
  /* Verified >= 4.5:1 on --background oklch(1 0 0). See app/globals.spec.ts.
     Hue 65 not 85: yellow cannot clear AA on white at usable chroma. */
  --success: oklch(0.52 0.12 150);
  --warning: oklch(0.55 0.12 65);
  --danger: oklch(0.52 0.17 27.325);
}

.dark {
  /* Verified >= 4.5:1 on --background oklch(0.141 0.005 285.823). */
  --success: oklch(0.74 0.13 150);
  --warning: oklch(0.78 0.13 65);
  --danger: oklch(0.65 0.17 27.325);
}
```

Comments record *why the number is that number* and where it is enforced. They do not
restate what the declaration already says.

## Testing Strategy

Vitest, per the existing setup. One new spec, `app/globals.spec.ts`.

It reads `app/globals.css` from disk and regex-extracts the `--success`, `--warning`,
`--danger` and `--chart-1..3` declarations from the `:root` and `.dark` blocks, then
asserts each against the `--background` declared in the *same* block.

Reading the shipped stylesheet is the point. A spec holding its own copy of the values
passes forever while the CSS drifts; parsing the real file means editing a token to an
illegible value fails the suite.

```ts
// app/globals.spec.ts
it.each(["light", "dark"] as const)("status tokens meet AA on %s", (theme) => {
  const { background, tokens } = parseThemeBlock(globalsCss, theme);
  for (const name of ["success", "warning", "danger"] as const) {
    expect(contrastRatio(tokens[name], background), name).toBeGreaterThanOrEqual(4.5);
  }
});
```

Cases covered:

- Each status token ≥ 4.5:1 against its own theme's `--background` (SC 1.4.3).
- Each `--chart-1..3` ≥ 3:1 against its own theme's `--background` (SC 1.4.11).
- Every token is inside the sRGB gamut — an out-of-gamut oklch value clips on render,
  so its real contrast differs from its nominal one.
- Each token is declared in **both** `:root` and `.dark`. A token defined in only one
  block inherits the wrong theme's value, which is how this class of bug returns.

Not covered, and deliberately: that components *use* the tokens. That belongs to
`data-presentation`, which is where the hardcoded `text-green-600` is removed.

## Boundaries

**Always**
- Verify a colour by computation before writing it into the stylesheet.
- Define every semantic token in both `:root` and `.dark`.
- Keep chroma restrained; the palette is near-neutral zinc and status colour is an
  accent, not a brand statement.

**Ask first**
- Adding any dependency, including a colour library. The contrast maths is ~40 lines.
- Changing `--background`, `--foreground`, `--primary` or `--radius`. Re-tuning the
  base palette invalidates every ratio in this document.
- Touching `components/ui/`. Out of scope by the map's design direction.

**Never**
- Hardcode a Tailwind palette class (`text-green-600`) for status. That is the bug.
- Lower the 4.5:1 floor, or weaken the spec, to make a preferred colour fit.
- Redefine `--chart-4` / `--chart-5` while nothing consumes them.
- Modify `lib/parser/` or `lib/engine/`.

## Success Criteria

1. `pnpm test` passes — 115 existing tests plus the new contrast spec, 0 regressions.
2. `pnpm lint` and `pnpm build` report 0 errors.
3. `--success`, `--warning`, `--danger` exist in both theme blocks, each ≥ 4.5:1
   against its own background, each in gamut.
4. `--chart-1..3` exist in both theme blocks, each ≥ 3:1, each in gamut.
5. Editing any token to a failing value makes `pnpm test` fail. Verify by temporarily
   setting `--warning: oklch(0.9 0.1 85)` and confirming red, then reverting.
6. Page content is horizontally centred at 1440px — header, main and footer share one
   centre line.
7. No new entry in `package.json`.
8. `git diff --stat` touches only the four files in Project Structure.

Criterion 5 is the one that matters. The others confirm the tokens are right today;
5 confirms the suite will notice when they stop being right.

## Open Questions

1. **Container: Option A or B?** Spec assumes B (`mx-auto w-full max-w-7xl`). B is
   three unambiguous lines; A is idiomatic but hinges on unverified `@utility`
   extend-vs-replace behaviour.
2. **`max-w-7xl` (80rem) the right measure?** It is the conventional default, but the
   radar table has six columns and may want 90rem. Easy to change later; worth a
   deliberate choice now since `app-shell` builds on it.
3. **Is amber-orange `--warning` acceptable?** It is measurably forced — see §1 — but
   it will visibly differ from the current yellow. Confirm before downstream modules
   depend on it.

# SPEC: Radar Dividend (Dividend Capture Screener)

## Objective

A fast, privacy-first, 100% client-side Next.js web application that reads Stockbit dividend calendar CSV exports, analyzes historical dividend cycles for IDX stocks, and highlights stocks entering the optimal **"Buy Window" (2–3 months / 60–90 days before estimated Cum Date)**. This allows retail investors to accumulate early at lower prices before dividend run-ups and avoid post-Ex Date capital loss.

Target Users: Indonesian stock market (IDX) retail investors who use Stockbit dividend data and want systematic dividend capture timing.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (strict mode)
- **Styling & UI:** Tailwind CSS v4, Shadcn / Base UI primitives, Lucide React icons
- **Parsing:** `papaparse` (client-side CSV parsing) + custom date/currency normalizer
- **Testing:** Vitest + React Testing Library + `@testing-library/jest-dom`
- **Package Manager:** `pnpm`

---

## Capability Map & Module Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Module 3: Screener UI                │
│ (Dashboard, Filters, Radar Table, Timeline, Export)   │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│               Module 2: Dividend Engine                │
│  (Cycle Analysis, Next Cum Estimator, Window Classifier)│
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                Module 1: CSV Parser                    │
│    (Stockbit CSV Reader, Normalizer, Demo Dataset)     │
└────────────────────────────────────────────────────────┘
```

### Module 1: `csv-parser` (`lib/parser/`)

- **Stockbit CSV Schema Mapping:** Parses headers matching `Symbol`/`Ticker`, `Cum Date`, `Ex Date`, `Payment Date`, `Dividend (Rp)` / `Cash Dividend`, `Yield (%)`, `Price`.
- **Date & Number Normalization:** Handles varying date formats (`DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MMM-YYYY`), removes currency symbols (`Rp`, `,`, `.`), handles missing fields.
- **Validation & Diagnostics:** Validates minimum required fields, collects warning diagnostics for skipped/malformed rows without crashing.
- **Built-in Demo Dataset:** Pre-bundled sample dataset of major IDX dividend payers (e.g. BBCA, BBRI, ASII, ITMG, PTBA, UNTR) for zero-setup demo exploration.

### Module 2: `dividend-engine` (`lib/engine/`)

- **Cycle Identification:** Groups events by ticker and dividend classification (Interim vs Final).
- **Historical Cadence & Next Cum Date Estimation:**
  - Identifies recurring announcement month and day offsets across prior years.
  - Projects estimated next Cum Date for the upcoming cycle.
- **Buy Window Classification:**
  - 🟢 `IN_WINDOW`: Current date is 60–90 days (2–3 months) before estimated Cum Date (prime accumulation zone).
  - 🟡 `APPROACHING`: Current date is 90–120 days (3–4 months) before estimated Cum Date (early watchlist).
  - 🔴 `LATE / HIGH_RISK`: Current date is < 30 days before estimated Cum Date or past Cum Date (price likely already surged).
  - ⚪ `OFF_CYCLE`: Beyond 120 days.
- **Yield Calculation & Annualization:** Computes trailing 12M yield and projected dividend yield %.

### Module 3: `screener-ui` (`components/` & `app/`)

- **Header & Hero:** App introduction, demo dataset loader, file upload dropzone.
- **Filter Controls:**
  - Minimum Yield threshold (slider / number input).
  - Accumulation month selector (Jan–Dec or "All").
  - Window status filter tabs (All, In Window, Approaching).
  - Search input (Ticker symbol or company name).
- **Radar Table:**
  - Columns: Ticker, Status Badge, Est. Cum Date, Days to Cum Date, Est. Yield %, Past Dividend History, Action.
  - Multi-column sort (Yield desc, Days to Cum asc, Ticker asc).
  - Expandable row detail showing historical dividend timeline.
- **Seasonality Timeline Visualizer:**
  - Interactive 12-month calendar grid / bar heatmap visualizing when radar stocks enter buy window vs when Cum Date occurs.
- **Watchlist Export & Tools:**
  - Export filtered list to CSV.
  - 1-click copy ticker list (e.g. `ASII,BBCA,PTBA`) for broker watchlist pasting.

---

## Commands

```bash
# Development server
pnpm dev

# Build production bundle
pnpm build

# Run unit and integration tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run linter
pnpm lint
```

---

## Project Structure

```
dividen/
├── app/
│   ├── globals.css          # Tailwind CSS v4 setup & theme variables
│   ├── layout.tsx           # App metadata, fonts, theme provider
│   └── page.tsx             # Main Radar Dividend dashboard page
├── components/
│   ├── ui/                  # Base UI / Shadcn primitives (Button, Input, Slider, Badge, Dialog)
│   ├── Dropzone.tsx         # CSV drag-and-drop & demo data loader
│   ├── FilterBar.tsx        # Screener filter controls (Yield, Month, Status, Search)
│   ├── RadarTable.tsx       # Main sortable opportunities table with expandable details
│   ├── SeasonalityChart.tsx # 12-month dividend & buy-window timeline distribution
│   ├── WatchlistExport.tsx  # CSV export and clipboard copy actions
│   └── StatsOverview.tsx    # High-level summary metrics (stocks in window, avg yield)
├── lib/
│   ├── parser/
│   │   ├── types.ts         # Raw Stockbit record types, normalized dividend types
│   │   ├── stockbit.ts      # CSV parser, header detector, normalizer
│   │   └── sample-data.ts   # Curated IDX dividend calendar demo data
│   ├── engine/
│   │   ├── types.ts         # DividendCycle, RadarOpportunity, WindowStatus types
│   │   ├── cycle.ts         # Cycle detection & next Cum Date estimation
│   │   └── radar.ts         # Radar screener pipeline & filter predicates
│   └── utils/
│       ├── date.ts          # Date math, month formatting, Indonesian locale helpers
│       ├── format.ts        # Currency, percentage, and number formatting
│       └── export.ts        # CSV generator & clipboard helper
├── test/
│   ├── parser.test.ts       # CSV parsing & normalization tests
│   ├── engine.test.ts       # Dividend cycle & buy-window estimation tests
│   └── components.test.tsx  # Key UI component render and filter tests
├── vitest.config.ts         # Vitest configuration with React Testing Library
├── SPEC.md                  # This specification document
└── package.json
```

---

## Code Style & Conventions

- **TypeScript:** Strict type checking. No `any`. Explicit interfaces for parser rows and engine outputs.
- **Functional & Pure:** Parser and calculation engine are pure functions with zero side-effects for testability.
- **Components:** React functional components with Tailwind utility classes.
- **Date Handling:** Robust pure date utilities avoiding timezone mutation bugs.

Example snippet:

```typescript
export interface StockbitDividendRow {
  symbol: string;
  cumDate: Date;
  exDate: Date;
  paymentDate?: Date;
  dividendPerShare: number;
  yieldPercent: number;
  dividendType: "Interim" | "Final" | "Special" | "Unknown";
}

export function classifyBuyWindow(
  estimatedCumDate: Date,
  referenceDate: Date = new Date(),
): { status: WindowStatus; daysToCumDate: number; daysToWindowStart: number } {
  const diffDays = differenceInDays(estimatedCumDate, referenceDate);
  if (diffDays >= 60 && diffDays <= 90) {
    return {
      status: "IN_WINDOW",
      daysToCumDate: diffDays,
      daysToWindowStart: 0,
    };
  }
  if (diffDays > 90 && diffDays <= 120) {
    return {
      status: "APPROACHING",
      daysToCumDate: diffDays,
      daysToWindowStart: diffDays - 90,
    };
  }
  if (diffDays < 60 && diffDays >= 0) {
    return { status: "LATE", daysToCumDate: diffDays, daysToWindowStart: 0 };
  }
  return {
    status: "OFF_CYCLE",
    daysToCumDate: diffDays,
    daysToWindowStart: Math.max(0, diffDays - 90),
  };
}
```

---

## Testing Strategy

- **Framework:** Vitest + `@testing-library/react` + `@testing-library/jest-dom`
- **Unit Test Coverage:**
  - `lib/parser/stockbit.ts`: Test parsing various Stockbit CSV formats, irregular date strings, missing values, corrupted rows, and empty files.
  - `lib/engine/cycle.ts`: Test estimation algorithms for regular annual final dividends, semi-annual (interim + final) dividends, and irregular historical dates.
  - `lib/engine/radar.ts`: Test filtering by yield, month, status, and edge-case date windows (e.g. year boundary transitions like Nov/Dec estimating Feb/Mar).
- **Integration Test:**
  - End-to-end client workflow: Load sample dataset -> apply min yield filter -> verify filtered table items and export count.

---

## Boundaries & Constraints

- **Always:**
  - Process all data 100% client-side in the user's browser.
  - Provide built-in sample demo data so the app is instantly testable without requiring a file upload.
  - Handle malformed or unexpected CSV rows gracefully with descriptive diagnostic messages.
  - Maintain mobile responsiveness across all views (cards on mobile, table on desktop).
- **Ask First:**
  - Adding persistent backend storage, database, or server APIs.
  - Adding heavy charting libraries when lightweight CSS/SVG charts suffice.
- **Never:**
  - Send user financial data or uploaded CSV files to any external server or telemetry endpoint.
  - Crash the UI when parsing invalid CSV input.
  - Silently drop unparseable rows without diagnostic warnings.

---

## Success Criteria

1. `pnpm test` runs and passes all unit tests for parser, cycle engine, and radar filtering.
2. User can upload a Stockbit CSV or click "Load Demo Data" and see a populated Radar table in under 500ms.
3. Radar correctly tags stocks entering buy window (60–90 days before estimated Cum Date) and calculates projected yield.
4. User can filter by yield %, target month, status, and search ticker.
5. User can view 12-month seasonality visualization and export filtered watchlist to CSV/clipboard.
6. `pnpm build` and `pnpm lint` pass with 0 errors.

# Idea One-Pager: Radar Dividend (Dividend Capture Screener)

## Problem Statement
**How might we** help IDX retail investors spot dividend accumulation windows 2–3 months before estimated Cum Dates from raw Stockbit calendar CSVs, so they can accumulate early before pre-dividend price run-ups and avoid dividend traps?

---

## Recommended Direction
**Next.js Client-Side Web Application**
- **Architecture:** 100% client-side data processing using React/Next.js and Web APIs (FileReader / PapaParse). Zero server persistence needed; guarantees user privacy and zero backend maintenance costs.
- **Core Engine:**
  - Parse Stockbit dividend calendar CSV exports (dates, tickers, dividend per share, historical prices, yields).
  - Compute historical dividend seasonality & cycle patterns (e.g. Interim vs Final dividend cycles, typical announcement months).
  - Project estimated next Cum Date and identify active **"Buy Windows" (T minus 60–90 days)**.
  - Interactive multi-parameter filtering: Minimum Yield %, Target Accumulation Month, Market Cap / Liquidity, Dividend Frequency.
- **Visuals & UX:**
  - **Radar Dashboard:** High-priority upcoming opportunities entering accumulation phase.
  - **Seasonal Dividend Calendar:** Monthly grid/timeline showing when tickers historically announce vs when to start accumulating.
  - **Watchlist Manager & Export:** Filtered radar export (CSV, clipboard) for direct import into trading apps/watchlists.

---

## Key Assumptions to Validate
1. **Stockbit CSV Schema Consistency:**
   - *Assumption:* Stockbit dividend export columns remain predictable (`Symbol`, `Cum Date`, `Ex Date`, `Payment Date`, `Dividend/Share`, `Yield`, etc.).
   - *Test:* Build robust schema mapper with fallback column detection and error feedback.
2. **Cycle Predictability:**
   - *Assumption:* IDX companies follow recurring seasonal dividend schedules (e.g., Q2 Final, Q4 Interim).
   - *Test:* Backtest historical date variances across top IDX dividend payers (ASII, BBCA, BBRI, PTBA, ITMG, ADRO).
3. **Retail Usability:**
   - *Assumption:* Users prefer drag-and-drop CSV upload with instant browser-side analysis over complex spreadsheet formulas.
   - *Test:* Provide instant sample dataset preview alongside upload dropzone.

---

## MVP Scope (v1)
### In Scope:
- **Client-Side CSV Parser & Validator:** Drag-and-drop Stockbit CSV file reader with error handling and format guide. Sample dataset included for instant demo.
- **Cycle & Timing Calculation Engine:**
  - Historical cycle grouping by ticker and distribution type (Interim / Final).
  - Estimated next Cum Date calculation based on historical median/mean announcement offset.
  - Dynamic Buy Window categorization:
    - 🟢 *In Buy Window* (2–3 months before est. Cum Date)
    - 🟡 *Approaching Window* (3–4 months)
    - 🔴 *Too Late / High Risk* (< 1 month before Cum Date / Price already run up)
- **Interactive Screener & Table:**
  - Filters: Min Yield %, Target Cum Date Month, Sector/Ticker search.
  - Sortable columns: Symbol, Yield %, Est. Cum Date, Days to Window, Historical Consistency.
- **Visual Timeline & Heatmap:** Monthly distribution chart of dividend events across the year.
- **Export Utility:** Download filtered radar to CSV or copy watchlist tickers to clipboard.
- **Responsive Modern UI:** Clean Tailwind CSS dark/light theme, fast search, mobile-friendly table cards.

### Out of Scope (Future / Not Doing):
- Automated backend scraping or direct IDX API integration (adds maintenance burden, proxy costs, and rate limits).
- User authentication and cloud database (unnecessary complexity for MVP).
- Full fundamental valuation / DCF modeling (keep app focused on timing and capture screening).
- Direct broker order execution.

---

## Next Steps
1. Create data models & TypeScript type definitions for Stockbit CSV records and dividend cycle calculations.
2. Implement CSV parsing utility (`papaparse` or fast regex parser) with schema validation and fallback sample data.
3. Build dividend accumulation algorithm (cycle estimation, buy-window status tags, yield calculation).
4. Implement UI components (Dashboard, Filter Bar, Screener Table, Calendar Timeline, Watchlist Export).
5. Add unit tests for calculation engine and parser.

"use client";

import { useMemo, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { FilterBar } from "@/components/FilterBar";
import { StatsOverview } from "@/components/StatsOverview";
import { RadarTable } from "@/components/RadarTable";
import { SeasonalityChart } from "@/components/SeasonalityChart";
import { WatchlistExport } from "@/components/WatchlistExport";
import {
  calculateSummaryStats,
  detectDividendCycles,
  filterRadarOpportunities,
  generateRadarOpportunities,
} from "@/lib/engine";
import type { FilterOptions } from "@/lib/engine";
import type { ParseResult } from "@/lib/parser";

const DEFAULT_FILTERS: FilterOptions = {
  minYield: 0,
  targetMonth: "ALL",
  status: "ALL",
  searchQuery: "",
  sortBy: "yield",
  sortDirection: "desc",
};

const RISK_DISCLAIMER =
  "Projected dates and yields are estimates from historical dividend patterns, not financial advice. Past dividends do not guarantee future payments. Verify with official IDX announcements before trading.";

export default function Home() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  const opportunities = useMemo(() => {
    if (!parseResult) return [];
    const now = new Date();
    const cycles = detectDividendCycles(parseResult.rows, now);
    return generateRadarOpportunities(cycles, parseResult.rows, now);
  }, [parseResult]);

  const filtered = useMemo(
    () => filterRadarOpportunities(opportunities, filters),
    [opportunities, filters],
  );

  const stats = useMemo(() => calculateSummaryStats(filtered), [filtered]);

  const nextUpcomingCumDate = useMemo(() => {
    const upcoming = filtered
      .filter((opp) => opp.daysToCumDate >= 0)
      .sort((a, b) => a.daysToCumDate - b.daysToCumDate);
    return upcoming[0]?.estimatedNextCumDate ?? null;
  }, [filtered]);

  const handleClear = () => {
    setParseResult(null);
    setFilters(DEFAULT_FILTERS);
  };

  const dropzone = (
    <Dropzone
      onDataLoaded={setParseResult}
      currentData={parseResult}
      onClear={handleClear}
    />
  );

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold uppercase tracking-widest">
          Dividend Capture Radar
        </h1>
        {parseResult && (
          <p className="text-xs text-muted-foreground">{RISK_DISCLAIMER}</p>
        )}
      </div>
      {parseResult ? (
        <>
          <div className="space-y-4">
            <StatsOverview
              stats={stats}
              nextUpcomingCumDate={nextUpcomingCumDate}
            />
          </div>
          <div className="space-y-4">
            <FilterBar filters={filters} onFilterChange={setFilters} />
            <WatchlistExport opportunities={filtered} />
            <RadarTable opportunities={filtered} />
          </div>
          <div className="space-y-4">
            <SeasonalityChart opportunities={filtered} />
          </div>
          {dropzone}
        </>
      ) : (
        dropzone
      )}
    </div>
  );
}

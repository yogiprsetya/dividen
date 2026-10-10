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

  return (
    <div className="space-y-6">
      <Dropzone
        onDataLoaded={setParseResult}
        currentData={parseResult}
        onClear={handleClear}
      />
      {parseResult && (
        <>
          <StatsOverview
            stats={stats}
            nextUpcomingCumDate={nextUpcomingCumDate}
          />
          <FilterBar filters={filters} onFilterChange={setFilters} />
          <WatchlistExport opportunities={filtered} />
          <RadarTable opportunities={filtered} />
          <SeasonalityChart opportunities={filtered} />
        </>
      )}
    </div>
  );
}

import React, { useMemo } from "react";
import { INDONESIAN_MONTH_NAMES, addDays } from "@/lib/utils/date";
import type { RadarOpportunity } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

interface SeasonalityChartProps {
  opportunities: RadarOpportunity[];
}

// The buy window opens 90 days and closes 60 days before the cum date (see classifyWindowStatus).
const WINDOW_START_DAYS_BEFORE = 90;
const WINDOW_END_DAYS_BEFORE = 60;

interface MonthBucket {
  cumTickers: string[];
  windowCount: number;
}

function bucketByMonth(opportunities: RadarOpportunity[]): MonthBucket[] {
  const buckets: MonthBucket[] = Array.from({ length: 12 }, () => ({
    cumTickers: [],
    windowCount: 0,
  }));

  for (const opp of opportunities) {
    buckets[Number(opp.estimatedNextCumDate.slice(5, 7)) - 1].cumTickers.push(opp.ticker);

    const windowMonths = new Set<number>();
    for (let d = WINDOW_START_DAYS_BEFORE; d >= WINDOW_END_DAYS_BEFORE; d--) {
      windowMonths.add(Number(addDays(opp.estimatedNextCumDate, -d).slice(5, 7)) - 1);
    }
    windowMonths.forEach((m) => buckets[m].windowCount++);
  }

  return buckets;
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

export function SeasonalityChart({ opportunities }: SeasonalityChartProps) {
  const buckets = useMemo(() => bucketByMonth(opportunities), [opportunities]);
  const maxWindows = Math.max(1, ...buckets.map((b) => b.windowCount));
  const maxCumDates = Math.max(1, ...buckets.map((b) => b.cumTickers.length));
  const currentMonth = new Date().getMonth();

  return (
    <section aria-labelledby="seasonality-heading" className="space-y-3">
      <h2 id="seasonality-heading" className="text-sm font-medium">
        Dividend seasonality
      </h2>
      {opportunities.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No dividend events to chart for the current filters.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        <span className="inline-block size-2 bg-chart-1 mr-1" />
        Buy windows
        <span className="inline-block size-2 bg-chart-2 ml-3 mr-1" />
        Cum dates
        <span className="ml-3">Today: underlined month</span>
      </p>
      <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {buckets.map((bucket, i) => {
          const name = INDONESIAN_MONTH_NAMES[i];
          const cumLabel = plural(bucket.cumTickers.length, "cum date");
          const windowLabel = plural(bucket.windowCount, "buy window");
          return (
            <li
              key={name}
              aria-label={`${name}: ${cumLabel}, ${windowLabel}`}
              className="border p-2 text-xs space-y-1"
            >
              <div
                className={cn(
                  "font-medium",
                  i === currentMonth && "inline-block border-b-2 border-foreground"
                )}
              >
                {name}
              </div>
              <div aria-hidden className="h-2 bg-muted">
                <div
                  className="h-full bg-chart-1"
                  style={{ width: `${(bucket.windowCount / maxWindows) * 100}%` }}
                />
              </div>
              <div aria-hidden className="h-2 bg-muted">
                <div
                  className="h-full bg-chart-2"
                  style={{ width: `${(bucket.cumTickers.length / maxCumDates) * 100}%` }}
                />
              </div>
              <div className="text-muted-foreground">{windowLabel}</div>
              <div className="text-muted-foreground">{cumLabel}</div>
              {bucket.cumTickers.length > 0 && (
                <ul className="flex flex-wrap gap-x-3 gap-y-1 font-medium">
                  {bucket.cumTickers.map((t, n) => (
                    <li key={t}>
                      {n > 0 && <span aria-hidden>· </span>}
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

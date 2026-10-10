import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { sortRadarOpportunities } from "@/lib/engine/radar";
import type { FilterOptions, RadarOpportunity, WindowStatus } from "@/lib/engine/types";
import { formatDateIndonesian } from "@/lib/utils/date";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

interface RadarTableProps {
  opportunities: RadarOpportunity[];
}

type SortBy = Extract<FilterOptions["sortBy"], "yield" | "daysToCumDate" | "ticker">;
type SortDirection = FilterOptions["sortDirection"];

const STATUS_DISPLAY: Record<WindowStatus, { label: string; icon: typeof Icons.logo; className: string }> = {
  OPTIMAL: { label: "In Window", icon: Icons.status.optimal, className: "text-green-600" },
  APPROACHING: { label: "Approaching", icon: Icons.status.approaching, className: "text-yellow-600" },
  LATE: { label: "Late", icon: Icons.status.late, className: "text-red-600" },
  OFF_CYCLE: { label: "Off Cycle", icon: Icons.status.offCycle, className: "text-muted-foreground" },
};

const DEFAULT_DIRECTION: Record<SortBy, SortDirection> = {
  yield: "desc",
  daysToCumDate: "asc",
  ticker: "asc",
};

const TYPE_LABEL = { INTERIM: "Interim", FINAL: "Final", UNKNOWN: "Unknown" } as const;

function StatusBadge({ status }: { status: WindowStatus }) {
  const { label, icon: Icon, className } = STATUS_DISPLAY[status];
  return (
    <Badge className={className}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}

function HistoryDetails({ opportunity }: { opportunity: RadarOpportunity }) {
  return (
    <ul className="space-y-1 text-sm">
      {opportunity.history.map((record) => (
        <li key={`${record.year}-${record.cumDate}`} className="flex flex-wrap gap-x-4">
          <span className="font-medium">{record.year}</span>
          <span>{formatDateIndonesian(record.cumDate)}</span>
          <span>{TYPE_LABEL[record.dividendType]}</span>
          <span>{formatCurrency(record.dividendPerShare)}</span>
          <span>{formatPercent(record.yieldPercent)}</span>
        </li>
      ))}
    </ul>
  );
}

function HistoryToggle({
  opportunity,
  expanded,
  onToggle,
}: {
  opportunity: RadarOpportunity;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <Button
      variant="ghost"
      size="xs"
      aria-expanded={expanded}
      aria-label={`${expanded ? "Hide" : "Show"} history for ${opportunity.ticker}`}
      onClick={onToggle}
    >
      {opportunity.history.length} payouts
      <Chevron aria-hidden />
    </Button>
  );
}

export function RadarTable({ opportunities }: RadarTableProps) {
  const [sortBy, setSortBy] = useState<SortBy>("yield");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const sorted = useMemo(
    () => sortRadarOpportunities(opportunities, sortBy, sortDirection),
    [opportunities, sortBy, sortDirection],
  );

  const handleSort = (column: SortBy) => {
    if (column === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }
    setSortBy(column);
    setSortDirection(DEFAULT_DIRECTION[column]);
  };

  const toggleExpanded = (ticker: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(ticker)) next.add(ticker);
      return next;
    });
  };

  const ariaSort = (column: SortBy) =>
    sortBy === column ? (sortDirection === "asc" ? "ascending" : "descending") : "none";

  const sortHeader = (column: SortBy, label: string) => (
    <Button variant="ghost" size="xs" aria-label={`Sort by ${label}`} onClick={() => handleSort(column)}>
      {label}
    </Button>
  );

  if (opportunities.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        No opportunities match the current filters.
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" aria-sort={ariaSort("ticker")} className="p-2">
                {sortHeader("ticker", "Symbol")}
              </th>
              <th scope="col" className="p-2">Status</th>
              <th scope="col" className="p-2">Est. Cum Date</th>
              <th scope="col" aria-sort={ariaSort("daysToCumDate")} className="p-2">
                {sortHeader("daysToCumDate", "Days to Cum Date")}
              </th>
              <th scope="col" aria-sort={ariaSort("yield")} className="p-2">
                {sortHeader("yield", "Est. Yield")}
              </th>
              <th scope="col" className="p-2">Historical Payouts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((opp) => {
              const isExpanded = expanded.has(opp.ticker);
              return (
                <React.Fragment key={opp.ticker}>
                  <tr className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{opp.ticker}</div>
                      <div className="text-xs text-muted-foreground">{opp.companyName}</div>
                    </td>
                    <td className="p-3"><StatusBadge status={opp.windowStatus} /></td>
                    <td className="p-3">{formatDateIndonesian(opp.estimatedNextCumDate)}</td>
                    <td className="p-3">
                      {opp.daysToCumDate}
                      {opp.daysToWindowStart > 0 && (
                        <div className="text-xs text-muted-foreground">
                          window in {opp.daysToWindowStart} days
                        </div>
                      )}
                    </td>
                    <td className="p-3">{formatPercent(opp.estimatedYield)}</td>
                    <td className="p-3">
                      <HistoryToggle
                        opportunity={opp}
                        expanded={isExpanded}
                        onToggle={() => toggleExpanded(opp.ticker)}
                      />
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-muted/30">
                      <td colSpan={6} className="p-3">
                        <HistoryDetails opportunity={opp} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div data-testid="radar-cards" className="md:hidden space-y-3">
        {sorted.map((opp) => {
          const isExpanded = expanded.has(opp.ticker);
          return (
            <article key={opp.ticker} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{opp.ticker}</div>
                  <div className="text-xs text-muted-foreground">{opp.companyName}</div>
                </div>
                <StatusBadge status={opp.windowStatus} />
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Est. Cum Date</dt>
                  <dd>{formatDateIndonesian(opp.estimatedNextCumDate, { shortMonth: true })}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Days</dt>
                  <dd>{opp.daysToCumDate}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Est. Yield</dt>
                  <dd>{formatPercent(opp.estimatedYield)}</dd>
                </div>
              </dl>
              <HistoryToggle
                opportunity={opp}
                expanded={isExpanded}
                onToggle={() => toggleExpanded(opp.ticker)}
              />
              {isExpanded && <HistoryDetails opportunity={opp} />}
            </article>
          );
        })}
      </div>
    </>
  );
}

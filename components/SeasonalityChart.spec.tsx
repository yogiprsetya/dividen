import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SeasonalityChart } from "./SeasonalityChart";
import type { RadarOpportunity } from "@/lib/engine/types";

function makeOpportunity(ticker: string, estimatedNextCumDate: string): RadarOpportunity {
  return {
    ticker,
    companyName: `${ticker} Tbk`,
    currentPrice: 1000,
    estimatedNextCumDate,
    estimatedYield: 5,
    estimatedDividendPerShare: 50,
    windowStatus: "OPTIMAL",
    daysToCumDate: 70,
    daysToWindowStart: 0,
    historicalConsistency: 80,
    typicalMonth: Number(estimatedNextCumDate.slice(5, 7)),
    history: [],
  };
}

function month(name: string) {
  return screen.getByRole("listitem", { name: new RegExp(`^${name}`) });
}

describe("SeasonalityChart", () => {
  it("renders twelve months", () => {
    render(<SeasonalityChart opportunities={[]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
  });

  it("counts cum dates in the month they fall in", () => {
    render(
      <SeasonalityChart
        opportunities={[
          makeOpportunity("ASII", "2026-06-10"),
          makeOpportunity("BBCA", "2026-06-20"),
          makeOpportunity("PTBA", "2026-11-05"),
        ]}
      />,
    );

    expect(month("Juni")).toHaveAccessibleName(/2 cum dates/);
    expect(month("November")).toHaveAccessibleName(/1 cum date\b/);
    expect(within(month("Juni")).getByText("ASII")).toBeInTheDocument();
  });

  it("counts buy windows 60 to 90 days before the cum date, across months", () => {
    // cum 2026-06-10 -> window 2026-03-12 .. 2026-04-11
    render(<SeasonalityChart opportunities={[makeOpportunity("ASII", "2026-06-10")]} />);

    expect(month("Maret")).toHaveAccessibleName(/1 buy window/);
    expect(month("April")).toHaveAccessibleName(/1 buy window/);
    expect(month("Mei")).toHaveAccessibleName(/0 buy windows/);
  });

  it("wraps buy windows into the previous year", () => {
    // cum 2026-01-15 -> window 2025-10-17 .. 2025-11-16
    render(<SeasonalityChart opportunities={[makeOpportunity("ASII", "2026-01-15")]} />);

    expect(month("Oktober")).toHaveAccessibleName(/1 buy window/);
    expect(month("November")).toHaveAccessibleName(/1 buy window/);
  });

  it("shows an empty message when there are no opportunities", () => {
    render(<SeasonalityChart opportunities={[]} />);
    expect(screen.getByText(/no dividend events/i)).toBeInTheDocument();
  });
});

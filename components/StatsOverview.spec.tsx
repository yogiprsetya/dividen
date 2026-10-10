import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatsOverview } from "./StatsOverview";
import type { SummaryStats } from "@/lib/engine/types";

describe("StatsOverview", () => {
  const mockStats: SummaryStats = {
    totalTracked: 100,
    optimalCount: 15,
    approachingCount: 10,
    averageYield: 5.5,
  };

  it("renders all KPI cards", () => {
    render(<StatsOverview stats={mockStats} nextUpcomingCumDate="2023-10-15" />);
    
    expect(screen.getByText(/Active Buy Windows/i)).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    
    expect(screen.getByText(/Approaching Windows/i)).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    
    expect(screen.getByText(/Average Estimated Yield/i)).toBeInTheDocument();
    expect(screen.getByText("5.50%")).toBeInTheDocument();
    
    expect(screen.getByText(/Next Upcoming Cum Date/i)).toBeInTheDocument();
    expect(screen.getByText("2023-10-15")).toBeInTheDocument();
  });

  it("handles missing nextUpcomingCumDate", () => {
    render(<StatsOverview stats={mockStats} nextUpcomingCumDate={null} />);
    expect(screen.getByText(/Next Upcoming Cum Date/i)).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});

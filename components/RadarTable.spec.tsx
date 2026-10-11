import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RadarTable } from "./RadarTable";
import type { RadarOpportunity } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/utils/format";

function makeOpportunity(overrides: Partial<RadarOpportunity>): RadarOpportunity {
  return {
    ticker: "AAAA",
    companyName: "Company A",
    currentPrice: 1000,
    estimatedNextCumDate: "2026-12-01",
    estimatedYield: 5,
    estimatedDividendPerShare: 50,
    windowStatus: "OPTIMAL",
    daysToCumDate: 70,
    daysToWindowStart: 0,
    historicalConsistency: 80,
    typicalMonth: 12,
    history: [
      {
        year: 2025,
        cumDate: "2025-12-01",
        dividendPerShare: 48,
        yieldPercent: 4.8,
        dividendType: "FINAL",
      },
    ],
    ...overrides,
  };
}

const opportunities: RadarOpportunity[] = [
  makeOpportunity({ ticker: "BBCA", estimatedYield: 3, daysToCumDate: 100, windowStatus: "APPROACHING" }),
  makeOpportunity({ ticker: "ASII", estimatedYield: 8, daysToCumDate: 65, windowStatus: "OPTIMAL" }),
  makeOpportunity({ ticker: "PTBA", estimatedYield: 12, daysToCumDate: 20, windowStatus: "LATE" }),
];

function tickerOrder(): string[] {
  const table = screen.getByRole("table");
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent ?? "")
    .map((text) => text.slice(0, 4));
}

describe("RadarTable", () => {
  it("renders the required column headers", () => {
    render(<RadarTable opportunities={opportunities} />);
    const table = screen.getByRole("table");

    for (const name of [/Symbol/i, /Status/i, /Est\. Cum Date/i, /Days/i, /Est\. Yield/i, /Historical Payouts/i]) {
      expect(within(table).getByRole("columnheader", { name })).toBeInTheDocument();
    }
  });

  it("sorts by yield descending by default", () => {
    render(<RadarTable opportunities={opportunities} />);
    expect(tickerOrder()).toEqual(["PTBA", "ASII", "BBCA"]);
  });

  it("sorts by days ascending when the Days header is clicked", () => {
    render(<RadarTable opportunities={opportunities} />);
    fireEvent.click(screen.getByRole("button", { name: /Sort by Days/i }));
    expect(tickerOrder()).toEqual(["PTBA", "ASII", "BBCA"]);
    fireEvent.click(screen.getByRole("button", { name: /Sort by Days/i }));
    expect(tickerOrder()).toEqual(["BBCA", "ASII", "PTBA"]);
  });

  it("sorts alphabetically by ticker when the Symbol header is clicked", () => {
    render(<RadarTable opportunities={opportunities} />);
    fireEvent.click(screen.getByRole("button", { name: /Sort by Symbol/i }));
    expect(tickerOrder()).toEqual(["ASII", "BBCA", "PTBA"]);
  });

  it("toggles yield direction when the Yield header is clicked on the active column", () => {
    render(<RadarTable opportunities={opportunities} />);
    fireEvent.click(screen.getByRole("button", { name: /Sort by Est\. Yield/i }));
    expect(tickerOrder()).toEqual(["BBCA", "ASII", "PTBA"]);
  });

  it("shows a readable status label for each opportunity", () => {
    render(<RadarTable opportunities={opportunities} />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("In Window")).toBeInTheDocument();
    expect(within(table).getByText("Approaching")).toBeInTheDocument();
    expect(within(table).getByText("Late")).toBeInTheDocument();
  });

  it("expands a row to show historical payout records and collapses it again", () => {
    render(<RadarTable opportunities={opportunities} />);
    const table = screen.getByRole("table");
    const toggle = within(table).getByRole("button", { name: /Show history for ASII/i });

    expect(within(table).queryByText(/Final/)).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(within(table).getByText(/Final/)).toBeInTheDocument();
    expect(within(table).getByText("2025")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(within(table).queryByText(/Final/)).not.toBeInTheDocument();
  });

  it("renders a card layout alongside the table for mobile viewports", () => {
    render(<RadarTable opportunities={opportunities} />);
    const cards = screen.getByTestId("radar-cards");
    expect(within(cards).getAllByRole("article")).toHaveLength(3);
  });

  it("shows an empty message when there are no opportunities", () => {
    render(<RadarTable opportunities={[]} />);
    expect(screen.getByText(/No opportunities match/i)).toBeInTheDocument();
  });

  it("shows a caret on the active sort column whose direction follows the sort state", () => {
    render(<RadarTable opportunities={opportunities} />);
    const table = screen.getByRole("table");
    const yieldHeader = within(table).getByRole("columnheader", { name: /Est\. Yield/i });
    const symbolHeader = within(table).getByRole("columnheader", { name: /Symbol/i });

    expect(yieldHeader).toHaveAttribute("aria-sort", "descending");
    expect(yieldHeader.querySelector("svg.lucide-arrow-down")).not.toBeNull();
    expect(symbolHeader.querySelector("svg")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Sort by Est\. Yield/i }));
    expect(yieldHeader).toHaveAttribute("aria-sort", "ascending");
    expect(yieldHeader.querySelector("svg.lucide-arrow-up")).not.toBeNull();
    expect(yieldHeader.querySelector("svg.lucide-arrow-down")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Sort by Symbol/i }));
    expect(symbolHeader.querySelector("svg.lucide-arrow-up")).not.toBeNull();
    expect(yieldHeader.querySelector("svg")).toBeNull();
  });

  it("colors only the status icon with semantic tokens, not the label", () => {
    render(<RadarTable opportunities={[opportunities[1]]} />);
    const label = within(screen.getByRole("table")).getByText("In Window");
    expect(label.className).not.toMatch(/text-(success|warning|danger|green|yellow|red)/);
    expect(label.querySelector("svg")?.getAttribute("class")).toMatch(/text-success/);
  });

  it("shows price, estimated DPS and consistency without expanding a row, on desktop and mobile", () => {
    const opp = makeOpportunity({
      ticker: "UNVR",
      currentPrice: 2345,
      estimatedDividendPerShare: 67,
      historicalConsistency: 82.4,
    });
    render(<RadarTable opportunities={[opp]} />);
    const table = screen.getByRole("table");
    const cards = screen.getByTestId("radar-cards");
    const price = formatCurrency(2345);
    const dps = formatCurrency(67);

    for (const name of [/Price/i, /Est\. DPS/i, /Consistency/i]) {
      expect(within(table).getByRole("columnheader", { name })).toBeInTheDocument();
    }
    const headers = within(table).getAllByRole("columnheader").map((h) => h.textContent ?? "");
    expect(headers).toHaveLength(9);
    expect(headers[2]).toMatch(/Price/);
    expect(headers[5]).toMatch(/Est\. DPS/);
    expect(headers[7]).toMatch(/Consistency/);

    const cells = within(within(table).getAllByRole("row")[1]).getAllByRole("cell");
    expect(cells[2]).toHaveTextContent(price);
    expect(cells[5]).toHaveTextContent(dps);
    expect(cells[7]).toHaveTextContent("82/100");

    expect(within(cards).getByText("Price").nextSibling).toHaveTextContent(price);
    expect(within(cards).getByText("Est. DPS").nextSibling).toHaveTextContent(dps);
    expect(within(cards).getByText("Consistency").nextSibling).toHaveTextContent("82/100");
  });

  it("spans the expanded history row across all nine columns", () => {
    render(<RadarTable opportunities={[opportunities[1]]} />);
    const table = screen.getByRole("table");
    fireEvent.click(within(table).getByRole("button", { name: /Show history for ASII/i }));
    expect(within(table).getByText("2025").closest("td")).toHaveAttribute("colspan", "9");
  });
});

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WatchlistExport } from "./WatchlistExport";
import type { RadarOpportunity } from "@/lib/engine/types";

function makeOpportunity(ticker: string): RadarOpportunity {
  return {
    ticker,
    companyName: `${ticker} Tbk`,
    currentPrice: 1000,
    estimatedNextCumDate: "2026-12-01",
    estimatedYield: 5,
    estimatedDividendPerShare: 50,
    windowStatus: "OPTIMAL",
    daysToCumDate: 70,
    daysToWindowStart: 0,
    historicalConsistency: 80,
    typicalMonth: 12,
    history: [],
  };
}

const opportunities = ["ASII", "BBCA", "BBRI"].map(makeOpportunity);

describe("WatchlistExport", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  it("copies the filtered tickers as a comma-separated string and confirms", async () => {
    render(<WatchlistExport opportunities={opportunities} />);

    fireEvent.click(screen.getByRole("button", { name: /copy tickers/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("ASII,BBCA,BBRI"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Copied 3 tickers"));
  });

  it("clears the status message 3000 ms after it is set", async () => {
    vi.useFakeTimers();
    try {
      render(<WatchlistExport opportunities={opportunities} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /copy tickers/i }));
      });
      expect(screen.getByRole("status")).toHaveTextContent("Copied 3 tickers");

      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(screen.getByRole("status")).toHaveTextContent("Copied 3 tickers");

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    } finally {
      vi.useRealTimers();
    }
  });

  it("reports failure when the clipboard is unavailable", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    render(<WatchlistExport opportunities={opportunities} />);

    fireEvent.click(screen.getByRole("button", { name: /copy tickers/i }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/could not copy/i));
  });

  it("downloads only the filtered opportunities as a CSV file", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:csv");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<WatchlistExport opportunities={opportunities.slice(0, 2)} />);
    fireEvent.click(screen.getByRole("button", { name: /download csv/i }));

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const text = await blob.text();
    expect(text.split("\n")).toHaveLength(3);
    expect(text).toContain("ASII");
    expect(text).not.toContain("BBRI");
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:csv");
    click.mockRestore();
  });

  it("disables both actions when there is nothing to export", () => {
    render(<WatchlistExport opportunities={[]} />);

    expect(screen.getByRole("button", { name: /copy tickers/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /download csv/i })).toBeDisabled();
  });
});

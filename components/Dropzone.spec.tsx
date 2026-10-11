import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Dropzone } from "./Dropzone";
import { loadSampleDividendParseResult } from "../lib/parser/sample-data";

describe("Dropzone", () => {
  it("renders the dropzone area", () => {
    render(<Dropzone onDataLoaded={() => {}} />);
    expect(
      screen.getByText(/Drag & drop your Stockbit CSV here/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Load Demo Data/i)).toBeInTheDocument();
  });

  it("loads demo data when the button is clicked", async () => {
    const onDataLoaded = vi.fn();
    render(<Dropzone onDataLoaded={onDataLoaded} />);

    const demoButton = screen.getByText(/Load Demo Data/i);
    fireEvent.click(demoButton);

    await waitFor(() => {
      expect(onDataLoaded).toHaveBeenCalledTimes(1);
      const result = onDataLoaded.mock.calls[0][0];
      expect(result.validRows).toBeGreaterThan(0);
      expect(result.rows[0].ticker).toBeDefined();
    });
  });

  it("shows clear button when data is loaded", () => {
    const { rerender } = render(<Dropzone onDataLoaded={() => {}} />);
    expect(screen.queryByText(/Clear Data/i)).not.toBeInTheDocument();

    const mockResult = loadSampleDividendParseResult();
    rerender(
      <Dropzone
        onDataLoaded={() => {}}
        currentData={mockResult}
        onClear={() => {}}
      />,
    );

    expect(screen.getByText(/Clear Data/i)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${mockResult.validRows} rows loaded`, "i")),
    ).toBeInTheDocument();
  });

  it("calls onClear when clear button is clicked", () => {
    const onClear = vi.fn();
    const mockResult = loadSampleDividendParseResult();
    render(
      <Dropzone
        onDataLoaded={() => {}}
        currentData={mockResult}
        onClear={onClear}
      />,
    );

    const clearButton = screen.getByText(/Clear Data/i);
    fireEvent.click(clearButton);

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("displays warnings if diagnostics exist", () => {
    const mockResult = loadSampleDividendParseResult();
    mockResult.diagnostics = [
      { type: "warning", message: "Skipped row 5 due to missing price" },
    ];

    render(
      <Dropzone
        onDataLoaded={() => {}}
        currentData={mockResult}
        onClear={() => {}}
      />,
    );

    expect(
      screen.getByText(/Skipped row 5 due to missing price/i),
    ).toBeInTheDocument();
  });

  it("uses the success token for the loaded icon", () => {
    const { container } = render(
      <Dropzone
        onDataLoaded={() => {}}
        currentData={loadSampleDividendParseResult()}
      />,
    );
    expect(container.querySelector("svg.text-success")).toBeInTheDocument();
    expect(container.querySelector(".text-green-500")).not.toBeInTheDocument();
  });

  it("renders the drop area without radius", () => {
    const { container } = render(<Dropzone onDataLoaded={() => {}} />);
    expect(container.querySelector("[class*='rounded-xl'], [class*='rounded-full'], [class*='rounded-lg']")).toBeNull();
  });
});

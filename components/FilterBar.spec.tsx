import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterBar } from "./FilterBar";
import type { FilterOptions } from "@/lib/engine/types";

describe("FilterBar", () => {
  const defaultFilters: FilterOptions = {
    minYield: 0,
    targetMonth: "ALL",
    status: "ALL",
    searchQuery: "",
    sortBy: "yield",
    sortDirection: "desc",
  };

  it("renders all filter controls", () => {
    render(<FilterBar filters={defaultFilters} onFilterChange={vi.fn()} />);

    expect(screen.getByText(/Minimum Yield/i)).toBeInTheDocument();
    expect(screen.getByText(/Accumulation Month/i)).toBeInTheDocument();
    expect(screen.getByText(/Window Status/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search ticker or company/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Reset Filters/i }),
    ).toBeInTheDocument();
  });

  it("calls onFilterChange when search query changes after debounce", async () => {
    const onFilterChange = vi.fn();
    render(
      <FilterBar filters={defaultFilters} onFilterChange={onFilterChange} />,
    );

    const searchInput = screen.getByPlaceholderText(
      /Search ticker or company/i,
    );
    fireEvent.change(searchInput, { target: { value: "BBCA" } });

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: "BBCA",
      }),
    );
  });

  it("calls onFilterChange when reset button is clicked", () => {
    const onFilterChange = vi.fn();
    const activeFilters = {
      ...defaultFilters,
      searchQuery: "BBCA",
      minYield: 5,
    };
    render(
      <FilterBar filters={activeFilters} onFilterChange={onFilterChange} />,
    );

    const resetButton = screen.getByRole("button", { name: /Reset Filters/i });
    fireEvent.click(resetButton);

    expect(onFilterChange).toHaveBeenCalledWith(defaultFilters);
  });
});

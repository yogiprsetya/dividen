import { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { FilterBar } from "./FilterBar";
import type { FilterOptions } from "@/lib/engine/types";

describe("FilterBar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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
      screen.getByPlaceholderText(/Search ticker/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Reset Filters/i }),
    ).toBeInTheDocument();
  });

  it("gives every filter control an accessible name", () => {
    render(<FilterBar filters={defaultFilters} onFilterChange={vi.fn()} />);

    expect(screen.getByLabelText("Search ticker")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Minimum Yield" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Accumulation Month")).toBeInTheDocument();
    expect(
      screen.getByRole("tablist", { name: "Window Status" }),
    ).toBeInTheDocument();
  });

  it("shows the selected month's name, not its number, in the month trigger", () => {
    render(
      <FilterBar
        filters={{ ...defaultFilters, targetMonth: 3 }}
        onFilterChange={vi.fn()}
      />,
    );

    const trigger = screen.getByLabelText("Accumulation Month");
    expect(trigger).toHaveTextContent("Maret");
    expect(trigger).not.toHaveTextContent(/^3$/);
  });

  it("calls onFilterChange when search query changes after debounce", async () => {
    const onFilterChange = vi.fn();
    render(
      <FilterBar filters={defaultFilters} onFilterChange={onFilterChange} />,
    );

    const searchInput = screen.getByPlaceholderText(
      /Search ticker/i,
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

  it("clears the search box on reset so the old query is not re-applied", () => {
    vi.useFakeTimers();
    const seen: FilterOptions[] = [];
    function Harness() {
      const [filters, setFilters] = useState(defaultFilters);
      seen.push(filters);
      return <FilterBar filters={filters} onFilterChange={setFilters} />;
    }
    render(<Harness />);
    const search = screen.getByLabelText(/Search ticker/i);

    fireEvent.change(search, { target: { value: "BB" } });
    act(() => vi.advanceTimersByTime(300));
    expect(seen.at(-1)?.searchQuery).toBe("BB");

    fireEvent.click(screen.getByRole("button", { name: /Reset Filters/i }));
    act(() => vi.advanceTimersByTime(300));

    expect(search).toHaveValue("");
    expect(seen.at(-1)?.searchQuery).toBe("");
  });

  it("renders the container without radius or shadow", () => {
    const { container } = render(
      <FilterBar filters={defaultFilters} onFilterChange={vi.fn()} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toMatch(/rounded-lg|shadow-sm/);
  });
});

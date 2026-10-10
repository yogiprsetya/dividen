import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./page";

function loadDemo() {
  fireEvent.click(screen.getByRole("button", { name: /Load Demo Data/i }));
}

describe("Home page", () => {
  it("shows the empty state with a demo loader and no results before data is loaded", () => {
    render(<Home />);

    expect(screen.getByText(/Drag & drop your Stockbit CSV here/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load Demo Data/i })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/Active Buy Windows/i)).not.toBeInTheDocument();
  });

  it("renders stats, filters, table, chart and export after loading demo data", () => {
    render(<Home />);
    loadDemo();

    expect(screen.getByText(/Active Buy Windows/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search ticker or company/i)).toBeInTheDocument();
    const table = screen.getByRole("table");
    for (const ticker of ["ASII", "BBCA", "BBRI", "ITMG", "PTBA", "UNTR"]) {
      expect(within(table).getByText(ticker)).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: /Dividend seasonality/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download CSV/i })).toBeEnabled();
  });

  it("narrows the table when the search filter changes", async () => {
    render(<Home />);
    loadDemo();

    fireEvent.change(screen.getByPlaceholderText(/Search ticker or company/i), {
      target: { value: "BBCA" },
    });

    const table = screen.getByRole("table");
    await waitFor(() => expect(within(table).queryByText("ASII")).not.toBeInTheDocument());
    expect(within(table).getByText("BBCA")).toBeInTheDocument();
  });

  it("returns to the empty state when data is cleared", () => {
    render(<Home />);
    loadDemo();

    fireEvent.click(screen.getByRole("button", { name: /Clear Data/i }));

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load Demo Data/i })).toBeInTheDocument();
  });
});

import React, { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterOptions, WindowStatus } from "@/lib/engine/types";
import { INDONESIAN_MONTH_NAMES } from "@/lib/utils/date";
import { Label } from "./ui/label";

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const MONTH_ITEMS = [
  { value: "ALL", label: "All Months" },
  ...INDONESIAN_MONTH_NAMES.map((label, i) => ({
    value: String(i + 1),
    label,
  })),
];

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.searchQuery);
  const [debouncedSearchValue] = useDebounce(searchValue, 300);

  useEffect(() => {
    if (debouncedSearchValue !== filters.searchQuery) {
      onFilterChange({ ...filters, searchQuery: debouncedSearchValue });
    }
  }, [debouncedSearchValue, filters, onFilterChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleMinYieldChange = (value: number | readonly number[]) => {
    onFilterChange({
      ...filters,
      minYield: typeof value === "number" ? value : value[0],
    });
  };

  const handleMonthChange = (value: string | null) => {
    onFilterChange({
      ...filters,
      targetMonth:
        value === null || value === "ALL" ? "ALL" : parseInt(value, 10),
    });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filters, status: value as WindowStatus | "ALL" });
  };

  const handleReset = () => {
    setSearchValue("");
    onFilterChange({
      minYield: 0,
      targetMonth: "ALL",
      status: "ALL",
      searchQuery: "",
      sortBy: "yield",
      sortDirection: "desc",
    });
  };

  return (
    <div className="space-y-8 p-4 bg-card ring-1 ring-foreground/5">
      <div className="flex gap-4 items-center justify-between">
        <div className="flex-1 w-full md:max-w-sm">
          <Label htmlFor="filter-search" className="sr-only">
            Search ticker or company
          </Label>

          <Input
            id="filter-search"
            placeholder="Search ticker or company..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>

        <Button variant="outline" onClick={handleReset}>
          Reset Filters
        </Button>
      </div>

      <div className="flex justify-between gap-6">
        <div className="w-44">
          <div className="flex justify-between mb-4">
            <Label id="filter-min-yield-label">Minimum Yield</Label>

            <span className="text-sm text-muted-foreground">
              {filters.minYield}%
            </span>
          </div>

          <Slider
            aria-labelledby="filter-min-yield-label"
            value={[filters.minYield]}
            onValueChange={handleMinYieldChange}
            max={25}
            step={0.5}
          />
        </div>

        <div>
          <Label htmlFor="filter-month" className="mb-3">
            Accumulation Month
          </Label>

          <Select
            items={MONTH_ITEMS}
            value={filters.targetMonth.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger id="filter-month" className="w-44">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>

            <SelectContent>
              {MONTH_ITEMS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label id="filter-status-label" className="mb-3">
            Window Status
          </Label>

          <Tabs value={filters.status} onValueChange={handleStatusChange}>
            <TabsList
              aria-labelledby="filter-status-label"
              className="w-full grid grid-cols-3"
            >
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="OPTIMAL">In Window</TabsTrigger>
              <TabsTrigger value="APPROACHING">Approaching</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

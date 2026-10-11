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

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
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
    <div className="space-y-4 p-4 bg-card ring-1 ring-foreground/5">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 w-full md:max-w-sm">
          <Input
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Minimum Yield</label>
            <span className="text-sm text-muted-foreground">
              {filters.minYield}%
            </span>
          </div>
          <Slider
            value={[filters.minYield]}
            onValueChange={handleMinYieldChange}
            max={25}
            step={0.5}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Accumulation Month</label>
          <Select
            value={filters.targetMonth.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Months</SelectItem>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Window Status</label>
          <Tabs value={filters.status} onValueChange={handleStatusChange}>
            <TabsList className="w-full grid grid-cols-3">
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

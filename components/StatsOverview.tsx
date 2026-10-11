import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryStats } from "@/lib/engine/types";

interface StatsOverviewProps {
  stats: SummaryStats;
  nextUpcomingCumDate: string | null;
}

export function StatsOverview({
  stats,
  nextUpcomingCumDate,
}: StatsOverviewProps) {
  if (stats.totalTracked === 0) {
    return <p className="text-sm text-muted-foreground">No data loaded</p>;
  }

  return (
    <>
      <h2 className="sr-only">Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Buy Windows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.optimalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approaching Windows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approachingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Estimated Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageYield.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Next Upcoming Cum Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextUpcomingCumDate || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

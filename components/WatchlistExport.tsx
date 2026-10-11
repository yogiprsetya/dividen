import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import type { RadarOpportunity } from "@/lib/engine/types";
import { buildWatchlistClipboard, exportOpportunitiesToCSV } from "@/lib/utils/export";

const MESSAGE_TIMEOUT_MS = 3000;

interface WatchlistExportProps {
  opportunities: RadarOpportunity[];
}

export function WatchlistExport({ opportunities }: WatchlistExportProps) {
  const [message, setMessage] = useState("");
  const isEmpty = opportunities.length === 0;

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(""), MESSAGE_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [message]);

  const copyTickers = async () => {
    const tickers = buildWatchlistClipboard(opportunities);
    try {
      await navigator.clipboard.writeText(tickers);
      const count = tickers.split(",").length;
      setMessage(`Copied ${count} ${count === 1 ? "ticker" : "tickers"}`);
    } catch {
      setMessage("Could not copy to clipboard");
    }
  };

  const downloadCSV = () => {
    const blob = new Blob([exportOpportunitiesToCSV(opportunities)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dividen-watchlist.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" disabled={isEmpty} onClick={downloadCSV}>
        <Icons.download aria-hidden />
        Download CSV
      </Button>
      <Button variant="outline" size="sm" disabled={isEmpty} onClick={copyTickers}>
        <Icons.copy aria-hidden />
        Copy Tickers
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

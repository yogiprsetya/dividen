import React, { useCallback, useState } from "react";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { parseStockbitCsv } from "../lib/parser";
import { loadSampleDividendParseResult } from "../lib/parser/sample-data";
import type { ParseResult } from "../lib/parser/types";

interface DropzoneProps {
  onDataLoaded: (result: ParseResult) => void;
  currentData?: ParseResult | null;
  onClear?: () => void;
}

export function Dropzone({
  onDataLoaded,
  currentData,
  onClear,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a valid CSV file.");
        return;
      }

      try {
        const text = await file.text();
        const result = parseStockbitCsv(text);
        onDataLoaded(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse CSV file.",
        );
      }
    },
    [onDataLoaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleLoadDemo = () => {
    setError(null);
    const result = loadSampleDividendParseResult();
    onDataLoaded(result);
  };

  if (currentData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 ring-1 ring-foreground/5 bg-muted/50">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-success" />
            <div>
              <p className="font-medium">Data Loaded Successfully</p>
              <p className="text-sm text-muted-foreground">
                {currentData.validRows} rows loaded ({currentData.skippedRows}{" "}
                skipped)
              </p>
            </div>
          </div>
          {onClear && (
            <Button variant="outline" size="sm" onClick={onClear}>
              <X className="w-4 h-4 mr-2" />
              Clear Data
            </Button>
          )}
        </div>

        {currentData.diagnostics.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Parse Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                {currentData.diagnostics.map((diag, i) => (
                  <li key={i}>{diag.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center p-12 border-2 border-dashed transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
        `}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload CSV file"
        />

        <div className="flex flex-col items-center text-center space-y-4 pointer-events-none">
          <div className="p-4 bg-muted">
            <UploadCloud className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-medium">
              Drag & drop your Stockbit CSV here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse files
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-center space-x-4">
        <div className="h-px bg-border flex-1" />
        <span className="text-sm text-muted-foreground uppercase tracking-wider">
          or
        </span>
        <div className="h-px bg-border flex-1" />
      </div>

      <div className="flex justify-center">
        <Button
          variant="secondary"
          onClick={handleLoadDemo}
          className="w-full sm:w-auto"
        >
          <FileText className="w-4 h-4 mr-2" />
          Load Demo Data
        </Button>
      </div>
    </div>
  );
}

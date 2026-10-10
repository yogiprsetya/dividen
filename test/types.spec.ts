import { describe, it, expect } from 'vitest';
import type {
  StockbitRawRow,
  StockbitDividendRow,
  ParseDiagnostic,
  ParseResult,
} from '@/lib/parser/types';
import type {
  WindowStatus,
  DividendCycle,
  RadarOpportunity,
  FilterOptions,
  SummaryStats,
} from '@/lib/engine/types';

describe('Shared Type Contracts & Harness', () => {
  it('instantiates valid Stockbit raw and normalized parser objects', () => {
    const rawRow: StockbitRawRow = {
      Symbol: 'BBCA',
      'Cum Date': '15/03/2024',
      'Ex Date': '16/03/2024',
      'Payment Date': '04/04/2024',
      'Cash Dividend': 'Rp 270',
      'Yield (%)': '2.8%',
      Price: '9,800',
    };
    expect(rawRow.Symbol).toBe('BBCA');

    const normalizedRow: StockbitDividendRow = {
      ticker: 'BBCA',
      companyName: 'Bank Central Asia Tbk.',
      cumDate: '2024-03-15',
      exDate: '2024-03-16',
      paymentDate: '2024-04-04',
      dividendPerShare: 270,
      yieldPercent: 2.8,
      price: 9800,
      dividendType: 'FINAL',
      year: 2024,
    };
    expect(normalizedRow.ticker).toBe('BBCA');
    expect(normalizedRow.dividendPerShare).toBe(270);
    expect(normalizedRow.year).toBe(2024);

    const diagnostic: ParseDiagnostic = {
      type: 'warning',
      message: 'Invalid date format on row 5',
      rowNumber: 5,
    };
    expect(diagnostic.type).toBe('warning');

    const parseResult: ParseResult = {
      rows: [normalizedRow],
      diagnostics: [diagnostic],
      totalRows: 1,
      validRows: 1,
      skippedRows: 0,
    };
    expect(parseResult.rows.length).toBe(1);
  });

  it('instantiates valid Engine types including WindowStatus and RadarOpportunity', () => {
    const status: WindowStatus = 'OPTIMAL';
    expect(status).toBe('OPTIMAL');

    const cycle: DividendCycle = {
      ticker: 'BBCA',
      frequency: 'SEMI_ANNUAL',
      typicalMonths: [3, 11],
      historicalDividends: [
        {
          year: 2023,
          cumDate: '2023-03-14',
          dividendPerShare: 205,
          yieldPercent: 2.5,
          dividendType: 'FINAL',
        },
      ],
      estimatedNextCumDate: '2025-03-15',
      confidenceScore: 90,
    };
    expect(cycle.typicalMonths).toContain(3);

    const opportunity: RadarOpportunity = {
      ticker: 'BBCA',
      companyName: 'Bank Central Asia Tbk.',
      currentPrice: 9800,
      estimatedNextCumDate: '2025-03-15',
      estimatedYield: 3.2,
      estimatedDividendPerShare: 310,
      windowStatus: 'OPTIMAL',
      daysToCumDate: 75,
      daysToWindowStart: 0,
      historicalConsistency: 95,
      typicalMonth: 3,
      history: cycle.historicalDividends,
    };
    expect(opportunity.windowStatus).toBe('OPTIMAL');
    expect(opportunity.daysToCumDate).toBe(75);

    const filters: FilterOptions = {
      minYield: 4.0,
      targetMonth: 'ALL',
      status: 'OPTIMAL',
      searchQuery: 'BB',
      sortBy: 'yield',
      sortDirection: 'desc',
    };
    expect(filters.minYield).toBe(4.0);

    const stats: SummaryStats = {
      totalTracked: 50,
      optimalCount: 12,
      approachingCount: 8,
      averageYield: 5.4,
      topOpportunity: opportunity,
    };
    expect(stats.optimalCount).toBe(12);
  });
});

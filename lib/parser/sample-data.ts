import { parseStockbitCsv } from "./index";
import type { StockbitDividendRow, ParseOptions, ParseResult } from "./types";

/**
 * Curated sample Stockbit CSV dataset of major IDX dividend payers:
 * ASII, BBCA, BBRI, ITMG, PTBA, UNTR across multiple years (2022-2024).
 * Includes both Interim and Final dividend distributions.
 */
export const SAMPLE_STOCKBIT_CSV = `Symbol,Company Name,Cum Date,Ex Date,Payment Date,Dividend (Rp),Yield (%),Price,Type
ASII,Astra International Tbk,10/05/2022,11/05/2022,20/05/2022,194,2.64%,7350,Final
ASII,Astra International Tbk,10/10/2022,11/10/2022,24/10/2022,88,1.32%,6650,Interim
ASII,Astra International Tbk,08/05/2023,09/05/2023,19/05/2023,552,8.76%,6300,Final
ASII,Astra International Tbk,12/10/2023,13/10/2023,31/10/2023,82,1.40%,5850,Interim
ASII,Astra International Tbk,13/05/2024,14/05/2024,30/05/2024,421,8.96%,4700,Final
ASII,Astra International Tbk,11/10/2024,14/10/2024,31/10/2024,98,1.89%,5175,Interim
BBCA,Bank Central Asia Tbk,25/03/2022,29/03/2022,19/04/2022,120,1.51%,7925,Final
BBCA,Bank Central Asia Tbk,01/12/2022,02/12/2022,20/12/2022,35,0.40%,8650,Interim
BBCA,Bank Central Asia Tbk,28/03/2023,29/03/2023,14/04/2023,170,1.93%,8825,Final
BBCA,Bank Central Asia Tbk,01/12/2023,04/12/2023,20/12/2023,42.5,0.48%,8925,Interim
BBCA,Bank Central Asia Tbk,22/03/2024,25/03/2024,04/04/2024,227.5,2.24%,10150,Final
BBCA,Bank Central Asia Tbk,03/12/2024,04/12/2024,20/12/2024,50,0.50%,10100,Interim
BBRI,Bank Rakyat Indonesia (Persero) Tbk,11/03/2022,14/03/2022,01/04/2022,117.4,2.56%,4590,Final
BBRI,Bank Rakyat Indonesia (Persero) Tbk,28/12/2022,29/12/2022,18/01/2023,57,1.15%,4940,Interim
BBRI,Bank Rakyat Indonesia (Persero) Tbk,21/03/2023,24/03/2023,12/04/2023,231.22,4.76%,4860,Final
BBRI,Bank Rakyat Indonesia (Persero) Tbk,29/12/2023,02/01/2024,18/01/2024,84,1.47%,5725,Interim
BBRI,Bank Rakyat Indonesia (Persero) Tbk,13/03/2024,14/03/2024,28/03/2024,235,3.88%,6050,Final
ITMG,Indo Tambangraya Megah Tbk,06/04/2022,07/04/2022,22/04/2022,3040,10.70%,28400,Final
ITMG,Indo Tambangraya Megah Tbk,04/11/2022,07/11/2022,22/11/2022,4128,9.90%,41675,Interim
ITMG,Indo Tambangraya Megah Tbk,10/04/2023,11/04/2023,18/04/2023,6416,16.04%,40000,Final
ITMG,Indo Tambangraya Megah Tbk,11/09/2023,12/09/2023,22/09/2023,2660,8.83%,30125,Interim
ITMG,Indo Tambangraya Megah Tbk,16/04/2024,17/04/2024,25/04/2024,1747,6.66%,26250,Final
ITMG,Indo Tambangraya Megah Tbk,02/09/2024,03/09/2024,25/09/2024,1228,4.57%,26850,Interim
PTBA,Bukit Asam Tbk,06/06/2022,07/06/2022,24/06/2022,688.51,15.27%,4510,Final
PTBA,Bukit Asam Tbk,23/06/2023,26/06/2023,14/07/2023,1094.05,28.79%,3800,Final
PTBA,Bukit Asam Tbk,20/05/2024,21/05/2024,07/06/2024,397.71,14.62%,2720,Final
UNTR,United Tractors Tbk,21/04/2022,22/04/2022,11/05/2022,905,3.08%,29400,Final
UNTR,United Tractors Tbk,06/10/2022,07/10/2022,24/10/2022,818,2.49%,32800,Interim
UNTR,United Tractors Tbk,27/04/2023,28/04/2023,12/05/2023,6185,20.76%,29800,Final
UNTR,United Tractors Tbk,05/10/2023,06/10/2023,24/10/2023,701,2.55%,27500,Interim
UNTR,United Tractors Tbk,06/05/2024,07/05/2024,22/05/2024,1569,6.49%,24175,Final
UNTR,United Tractors Tbk,04/10/2024,07/10/2024,24/10/2024,667,2.48%,26900,Interim`;

/**
 * Parses the built-in sample Stockbit CSV into full ParseResult with diagnostics.
 */
export function loadSampleDividendParseResult(
  options?: ParseOptions,
): ParseResult {
  return parseStockbitCsv(SAMPLE_STOCKBIT_CSV, options);
}

/**
 * Returns validated StockbitDividendRow items from the bundled sample dataset.
 */
export function loadSampleDividendData(
  options?: ParseOptions,
): StockbitDividendRow[] {
  const result = loadSampleDividendParseResult(options);
  return result.rows;
}

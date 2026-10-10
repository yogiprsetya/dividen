/**
 * Lightweight, zero-dependency RFC-4180 compliant CSV tokenizer/parser.
 */
export function parseCsvString(rawInput: string): string[][] {
  if (!rawInput) {
    return [];
  }

  // Strip UTF-8 Byte Order Mark (BOM) if present
  let text = rawInput;
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  if (text.trim().length === 0) {
    return [];
  }

  // Detect delimiter (comma vs semicolon) from first non-empty line
  const firstLine = text.split(/\r\n|\n|\r/)[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ";" : ",";

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote: ""
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }

      if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = "";
        i++;
        continue;
      }

      if (char === "\r" || char === "\n") {
        currentRow.push(currentField.trim());
        currentField = "";

        // Handle \r\n
        if (char === "\r" && i + 1 < text.length && text[i + 1] === "\n") {
          i++;
        }

        // Only push row if it contains at least one non-empty value
        if (currentRow.some((val) => val.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      }

      currentField += char;
      i++;
    }
  }

  // Flush remaining field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((val) => val.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

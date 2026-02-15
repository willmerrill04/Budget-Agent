import * as pdfjsLib from 'pdfjs-dist';
import type { Transaction } from '../types';
import { parseCSV } from './csv';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface TextItem {
  str: string;
  transform: number[];
}

/**
 * Extract text items from a PDF, grouped by page.
 */
async function extractTextItems(data: ArrayBuffer): Promise<TextItem[][]> {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: TextItem[][] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items
      .filter((item): item is { str: string; transform: number[]; dir: string; width: number; height: number; fontName: string; hasEOL: boolean } => 'str' in item && (item as { str: string }).str.trim().length > 0)
      .map(item => ({ str: item.str.trim(), transform: item.transform }));
    pages.push(items);
  }

  return pages;
}

/**
 * Group text items into rows based on their Y coordinate.
 * Items at the same Y position (within tolerance) form a row.
 */
function groupIntoRows(items: TextItem[], yTolerance = 3): string[][] {
  if (items.length === 0) return [];

  // Sort by Y descending (PDF coordinates: bottom-up), then X ascending
  const sorted = [...items].sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) > yTolerance) return yDiff;
    return a.transform[4] - b.transform[4];
  });

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentY = sorted[0].transform[5];

  for (const item of sorted) {
    if (Math.abs(item.transform[5] - currentY) > yTolerance) {
      if (currentRow.length > 0) rows.push(currentRow);
      currentRow = [];
      currentY = item.transform[5];
    }
    currentRow.push(item.str);
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return rows;
}

/**
 * Try to detect if rows form a table with date/description/amount patterns.
 * Returns CSV text if successful, null otherwise.
 */
function rowsToCSV(allRows: string[][]): string | null {
  if (allRows.length < 2) return null;

  // Date pattern: matches common date formats
  const dateRegex = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\w{3,9}\s+\d{1,2},?\s*\d{2,4})$/;

  // Find rows that look like transaction data (start with a date-like value)
  const dataRows: string[][] = [];
  let headerRow: string[] | null = null;

  for (const row of allRows) {
    if (row.length < 3) continue;

    // Check if this row looks like a header
    const lowerJoined = row.map(c => c.toLowerCase());
    const hasDateHeader = lowerJoined.some(c => c.includes('date'));
    const hasAmountHeader = lowerJoined.some(c =>
      c.includes('amount') || c.includes('debit') || c.includes('credit') || c.includes('balance')
    );
    if (hasDateHeader && hasAmountHeader && !headerRow) {
      headerRow = row;
      continue;
    }

    // Check if the first cell looks like a date
    if (dateRegex.test(row[0])) {
      dataRows.push(row);
    }
  }

  if (dataRows.length === 0) return null;

  // Build CSV: use detected header or create a synthetic one
  const header = headerRow || ['Date', 'Description', 'Amount'];
  const csvLines = [header.map(escapeCSVField).join(',')];

  for (const row of dataRows) {
    // Normalize: if the row has more columns than header, join middle columns as description
    if (row.length > header.length) {
      const date = row[0];
      const amount = row[row.length - 1];
      const desc = row.slice(1, row.length - 1).join(' ');
      csvLines.push([date, desc, amount].map(escapeCSVField).join(','));
    } else {
      csvLines.push(row.map(escapeCSVField).join(','));
    }
  }

  return csvLines.join('\n');
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Parse a PDF bank statement into transactions.
 * Extracts text, detects table structure, converts to CSV, then parses with the CSV parser.
 */
export async function parsePDF(data: ArrayBuffer): Promise<Transaction[]> {
  const pages = await extractTextItems(data);

  // Collect all rows across all pages
  const allRows: string[][] = [];
  for (const pageItems of pages) {
    const rows = groupIntoRows(pageItems);
    allRows.push(...rows);
  }

  const csvText = rowsToCSV(allRows);
  if (!csvText) return [];

  return parseCSV(csvText);
}

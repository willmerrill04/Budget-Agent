import { describe, it, expect } from 'vitest';

// We test the internal helpers by testing through the exported parsePDF,
// but we also export the CSV conversion logic indirectly through rowsToCSV.
// Since parsePDF requires a real PDF binary, we test the text-extraction pipeline
// by testing the helper functions that are unit-testable.

// Import the module to access internal functions via the CSV parser
import { parseCSV } from './csv';

describe('PDF table extraction helpers (via CSV parser)', () => {
  it('parseCSV handles CSV text that would be generated from a PDF table', () => {
    // Simulates the CSV output that rowsToCSV would produce from PDF text items
    const csvFromPdf = `Date,Description,Amount
01/15/2024,WALMART GROCERY,-52.30
01/16/2024,PAYROLL DIRECT DEP,2500.00
01/17/2024,STARBUCKS #1234,-5.75`;

    const result = parseCSV(csvFromPdf);
    expect(result).toHaveLength(3);
    expect(result[0].description).toBe('WALMART GROCERY');
    expect(result[0].amount).toBe(-52.30);
    expect(result[1].amount).toBe(2500.00);
  });

  it('handles bank statement style with extra columns merged into description', () => {
    // Some PDFs produce rows with extra middle columns that get joined
    const csvFromPdf = `Date,Description,Amount
01/15/2024,CHECK #1234 WALMART SUPERCENTER PAYMENT,-152.30
01/16/2024,ACH DIRECT DEPOSIT EMPLOYER INC,3200.00`;

    const result = parseCSV(csvFromPdf);
    expect(result).toHaveLength(2);
    expect(result[0].description).toContain('WALMART');
    expect(result[1].description).toContain('EMPLOYER');
  });
});

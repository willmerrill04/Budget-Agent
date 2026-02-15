import { describe, it, expect } from 'vitest';
import { parseCSV } from './csv';

describe('parseCSV', () => {
  it('parses a standard CSV with Date, Description, Amount headers', () => {
    const csv = `Date,Description,Amount
2024-01-15,Walmart Grocery,-52.30
2024-01-16,Payroll Direct Deposit,2500.00
2024-01-17,Starbucks Coffee,-5.75`;

    const result = parseCSV(csv);
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2024-01-15');
    expect(result[0].description).toBe('Walmart Grocery');
    expect(result[0].amount).toBe(-52.30);
    expect(result[0].category).toBe('Groceries');
    expect(result[1].category).toBe('Income');
    expect(result[2].category).toBe('Dining');
  });

  it('auto-detects alternative column names', () => {
    const csv = `Transaction Date,Memo,Debit
2024-02-01,Shell Gas Station,45.00
2024-02-02,Netflix Subscription,15.99`;

    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('Shell Gas Station');
    expect(result[0].amount).toBe(45.00);
    expect(result[1].description).toBe('Netflix Subscription');
  });

  it('handles parenthesized negative amounts', () => {
    const csv = `Date,Description,Amount
2024-03-01,Amazon Purchase,"(123.45)"`;

    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(-123.45);
  });

  it('handles amounts with currency symbols and commas', () => {
    const csv = `Date,Description,Amount
2024-03-01,Big Purchase,"$1,234.56"
2024-03-02,Refund,"+50.00"`;

    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(1234.56);
    expect(result[1].amount).toBe(50.00);
  });

  it('falls back to positional columns when headers are unrecognized', () => {
    const csv = `Col1,Col2,Col3,Col4
2024-04-01,Some Store,Extra Info,-20.00`;

    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    // Fallback: first=date, second=description, last=amount
    expect(result[0].date).toBe('2024-04-01');
    expect(result[0].description).toBe('Some Store');
    expect(result[0].amount).toBe(-20.00);
  });

  it('returns empty array for CSV with fewer than 2 rows', () => {
    expect(parseCSV('Date,Description,Amount')).toHaveLength(0);
    expect(parseCSV('')).toHaveLength(0);
  });

  it('returns empty array for CSV with fewer than 3 columns', () => {
    const csv = `A,B
1,2`;
    expect(parseCSV(csv)).toHaveLength(0);
  });

  it('skips rows with missing date or description', () => {
    const csv = `Date,Description,Amount
2024-05-01,Valid Row,-10.00
,Missing Date,-20.00
2024-05-03,,-30.00`;

    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Valid Row');
  });

  it('parses various date formats', () => {
    const csv = `Date,Description,Amount
01/15/2024,Purchase A,-10.00
2024-02-28,Purchase B,-20.00
March 3 2024,Purchase C,-30.00`;

    const result = parseCSV(csv);
    expect(result).toHaveLength(3);
    // All should be valid ISO dates
    result.forEach(t => {
      expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('generates unique IDs for each transaction', () => {
    const csv = `Date,Description,Amount
2024-01-01,Item A,-10
2024-01-02,Item B,-20
2024-01-03,Item C,-30`;

    const result = parseCSV(csv);
    const ids = result.map(t => t.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('handles Windows-style CRLF line endings', () => {
    const csv = "Date,Description,Amount\r\n2024-01-01,Walmart,-50\r\n2024-01-02,Target,-30\r\n";

    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });
});

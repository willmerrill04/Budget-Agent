import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction } from '../types';
import { categorizeTransaction } from './categories';

interface ColumnMapping {
  date: number;
  description: number;
  amount: number;
}

function detectColumns(headers: string[]): ColumnMapping | null {
  const lower = headers.map(h => h.toLowerCase().trim());

  let dateCol = -1;
  let descCol = -1;
  let amountCol = -1;

  const datePatterns = ['date', 'transaction date', 'posted date', 'posting date', 'trans date'];
  const descPatterns = ['description', 'memo', 'merchant', 'name', 'payee', 'transaction', 'details', 'narrative'];
  const amountPatterns = ['amount', 'debit', 'value', 'sum', 'total', 'charge'];

  // Assign columns in priority order: date first, then amount, then description.
  // Each column can only be assigned once.
  const used = new Set<number>();

  for (let i = 0; i < lower.length; i++) {
    if (dateCol === -1 && datePatterns.some(p => lower[i].includes(p))) {
      dateCol = i;
      used.add(i);
    }
  }
  for (let i = 0; i < lower.length; i++) {
    if (!used.has(i) && amountCol === -1 && amountPatterns.some(p => lower[i].includes(p))) {
      amountCol = i;
      used.add(i);
    }
  }
  for (let i = 0; i < lower.length; i++) {
    if (!used.has(i) && descCol === -1 && descPatterns.some(p => lower[i].includes(p))) {
      descCol = i;
      used.add(i);
    }
  }

  if (dateCol === -1 || descCol === -1 || amountCol === -1) {
    // Fallback: assume first=date, second=description, last=amount
    if (headers.length >= 3) {
      return { date: 0, description: 1, amount: headers.length - 1 };
    }
    return null;
  }

  return { date: dateCol, description: descCol, amount: amountCol };
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.\-+()]/g, '');
  // Handle parenthesized negatives like (123.45)
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    return -parseFloat(cleaned.slice(1, -1));
  }
  return parseFloat(cleaned) || 0;
}

function parseDate(value: string): string {
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return value;
}

export function parseCSV(text: string): Transaction[] {
  const result = Papa.parse(text, { skipEmptyLines: true });
  const rows = result.data as string[][];

  if (rows.length < 2) return [];

  const mapping = detectColumns(rows[0]);
  if (!mapping) return [];

  const transactions: Transaction[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[mapping.date] || !row[mapping.description]) continue;

    const description = row[mapping.description]?.trim() || '';
    const amount = parseAmount(row[mapping.amount] || '0');

    transactions.push({
      id: uuidv4(),
      date: parseDate(row[mapping.date].trim()),
      description,
      amount,
      category: categorizeTransaction(description),
    });
  }

  return transactions;
}

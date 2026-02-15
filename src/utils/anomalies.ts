import type { Transaction } from '../types';

export interface Anomaly {
  transaction: Transaction;
  multiple: number;
  categoryAvg: number;
}

export function detectAnomalies(transactions: Transaction[]): Anomaly[] {
  const expenses = transactions.filter(t => t.amount < 0);

  // group by category
  const byCategory: Record<string, Transaction[]> = {};
  for (const t of expenses) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  }

  const anomalies: Anomaly[] = [];

  for (const [, txns] of Object.entries(byCategory)) {
    if (txns.length < 2) continue;
    const avg = txns.reduce((s, t) => s + Math.abs(t.amount), 0) / txns.length;

    for (const t of txns) {
      const absAmount = Math.abs(t.amount);
      const multiple = absAmount / avg;
      if (multiple >= 2.5) {
        anomalies.push({ transaction: t, multiple: Math.round(multiple * 10) / 10, categoryAvg: Math.round(avg * 100) / 100 });
      }
    }
  }

  return anomalies.sort((a, b) => b.multiple - a.multiple);
}

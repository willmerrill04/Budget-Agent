import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Transaction } from '../types';
import { getCategoryColor } from '../utils/categories';

interface Props {
  transactions: Transaction[];
}

function getMonths(transactions: Transaction[]): string[] {
  const months = new Set<string>();
  for (const t of transactions) {
    const m = t.date.slice(0, 7);
    months.add(m);
  }
  return Array.from(months).sort().reverse();
}

export default function SpendingByCategory({ transactions }: Props) {
  const months = useMemo(() => getMonths(transactions), [transactions]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [drillCategory, setDrillCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let txns = transactions.filter(t => t.amount < 0);
    if (selectedMonth !== 'all') {
      txns = txns.filter(t => t.date.startsWith(selectedMonth));
    }
    return txns;
  }, [transactions, selectedMonth]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of filtered) {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const total = categoryData.reduce((s, d) => s + d.value, 0);

  if (drillCategory) {
    const categoryTxns = filtered.filter(t => t.category === drillCategory);
    return (
      <div className="space-y-4">
        <button
          onClick={() => setDrillCategory(null)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to all categories
        </button>
        <h3 className="text-lg font-bold text-gray-800">{drillCategory} Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-600">Date</th>
                <th className="text-left py-2 px-3 text-gray-600">Description</th>
                <th className="text-right py-2 px-3 text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {categoryTxns.map(t => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-700">{t.date}</td>
                  <td className="py-2 px-3 text-gray-700">{t.description}</td>
                  <td className="py-2 px-3 text-right text-red-600 font-medium">
                    ${Math.abs(t.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Spending by Category</h3>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white"
        >
          <option value="all">All months</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {categoryData.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No expense transactions found. Import a CSV to get started.</p>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={280} height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="value"
                    onClick={(entry) => setDrillCategory(entry.name)}
                    className="cursor-pointer"
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => `$${(value ?? 0).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center text-sm text-gray-500 mt-2">
                Total: <span className="font-bold text-gray-800">${total.toFixed(2)}</span>
              </p>
            </div>

            <div className="flex-1 space-y-2">
              {categoryData.map(d => {
                const pct = ((d.value / total) * 100).toFixed(1);
                return (
                  <div
                    key={d.name}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                    onClick={() => setDrillCategory(d.name)}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getCategoryColor(d.name) }}
                    />
                    <span className="text-sm font-medium text-gray-700 w-32">{d.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: getCategoryColor(d.name) }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-20 text-right">${d.value.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Bar Breakdown</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number | undefined) => `$${(value ?? 0).toFixed(2)}`} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={getCategoryColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

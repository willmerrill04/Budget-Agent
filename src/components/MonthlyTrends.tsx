import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

interface MonthData {
  month: string;
  expenses: number;
  income: number;
  savingsRate: number;
  expenseChange: number | null;
  incomeChange: number | null;
  savingsChange: number | null;
}

export default function MonthlyTrends({ transactions }: Props) {
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, { expenses: number; income: number }> = {};
    for (const t of transactions) {
      const m = t.date.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { expenses: 0, income: 0 };
      if (t.amount < 0) {
        byMonth[m].expenses += Math.abs(t.amount);
      } else {
        byMonth[m].income += t.amount;
      }
    }

    const months = Object.keys(byMonth).sort();
    const data: MonthData[] = months.map((month, i) => {
      const { expenses, income } = byMonth[month];
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
      const prev = i > 0 ? byMonth[months[i - 1]] : null;

      return {
        month,
        expenses: Math.round(expenses * 100) / 100,
        income: Math.round(income * 100) / 100,
        savingsRate: Math.round(savingsRate * 10) / 10,
        expenseChange: prev ? Math.round(((expenses - prev.expenses) / prev.expenses) * 1000) / 10 : null,
        incomeChange: prev && prev.income > 0 ? Math.round(((income - prev.income) / prev.income) * 1000) / 10 : null,
        savingsChange: prev ? Math.round((savingsRate - ((prev.income > 0 ? ((prev.income - prev.expenses) / prev.income) * 100 : 0))) * 10) / 10 : null,
      };
    });

    return data;
  }, [transactions]);

  const lastMonth = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].month : '';

  if (monthlyData.length === 0) {
    return <p className="text-gray-500 text-center py-8">No transaction data. Import a CSV to see trends.</p>;
  }

  const formatChange = (val: number | null, suffix = '%') => {
    if (val === null) return '';
    const sign = val > 0 ? '+' : '';
    const color = val > 0 ? 'text-red-500' : val < 0 ? 'text-green-500' : 'text-gray-500';
    return <span className={`text-xs font-medium ${color}`}>{sign}{val}{suffix}</span>;
  };

  const formatChangeSavings = (val: number | null) => {
    if (val === null) return '';
    const sign = val > 0 ? '+' : '';
    const color = val > 0 ? 'text-green-500' : val < 0 ? 'text-red-500' : 'text-gray-500';
    return <span className={`text-xs font-medium ${color}`}>{sign}{val}pp</span>;
  };

  const latest = monthlyData[monthlyData.length - 1];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-800">Month-over-Month Trends</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-sm text-red-600 font-medium">Expenses (Latest)</p>
          <p className="text-2xl font-bold text-red-700">${latest.expenses.toFixed(2)}</p>
          <div className="mt-1">{formatChange(latest.expenseChange)} vs prior month</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-sm text-green-600 font-medium">Income (Latest)</p>
          <p className="text-2xl font-bold text-green-700">${latest.income.toFixed(2)}</p>
          <div className="mt-1">{formatChange(latest.incomeChange)} vs prior month</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-blue-600 font-medium">Savings Rate (Latest)</p>
          <p className="text-2xl font-bold text-blue-700">{latest.savingsRate}%</p>
          <div className="mt-1">{formatChangeSavings(latest.savingsChange)} vs prior month</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-600 mb-3">Monthly Expenses</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Bar dataKey="expenses" radius={[4, 4, 0, 0]}>
              {monthlyData.map((entry) => (
                <Cell key={entry.month} fill={entry.month === lastMonth ? '#ef4444' : '#fca5a5'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-600 mb-3">Monthly Income</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Bar dataKey="income" radius={[4, 4, 0, 0]}>
              {monthlyData.map((entry) => (
                <Cell key={entry.month} fill={entry.month === lastMonth ? '#22c55e' : '#86efac'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-600 mb-3">Savings Rate (%)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Bar dataKey="savingsRate" radius={[4, 4, 0, 0]}>
              {monthlyData.map((entry) => (
                <Cell key={entry.month} fill={entry.month === lastMonth ? '#3b82f6' : '#93c5fd'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

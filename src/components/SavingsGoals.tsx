import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction, SavingsGoal } from '../types';

interface Props {
  transactions: Transaction[];
  goals: SavingsGoal[];
  onUpdateGoals: (goals: SavingsGoal[]) => void;
}

export default function SavingsGoals({ transactions, goals, onUpdateGoals }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [monthly, setMonthly] = useState('');

  // Calculate live savings rate
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const TARGET_RATE = 20;

  const handleAdd = () => {
    if (!name || !target) return;
    const newGoal: SavingsGoal = {
      id: uuidv4(),
      name,
      targetAmount: parseFloat(target) || 0,
      currentAmount: parseFloat(current) || 0,
      monthlyContribution: parseFloat(monthly) || 0,
    };
    onUpdateGoals([...goals, newGoal]);
    setName(''); setTarget(''); setCurrent(''); setMonthly('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    onUpdateGoals(goals.filter(g => g.id !== id));
  };

  const monthsRemaining = (goal: SavingsGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 0;
    if (goal.monthlyContribution <= 0) return Infinity;
    return Math.ceil(remaining / goal.monthlyContribution);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Savings Goals</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {/* Savings Rate Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <p className="text-sm text-blue-600 font-medium mb-1">Live Savings Rate</p>
        <div className="flex items-end gap-3">
          <span className={`text-3xl font-bold ${savingsRate >= TARGET_RATE ? 'text-green-600' : 'text-orange-600'}`}>
            {savingsRate.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500 mb-1">/ {TARGET_RATE}% target</span>
        </div>
        <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${savingsRate >= TARGET_RATE ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(100, (savingsRate / TARGET_RATE) * 100)}%` }}
          />
        </div>
        {totalIncome > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Income: ${totalIncome.toFixed(2)} | Expenses: ${totalExpenses.toFixed(2)} | Saved: ${(totalIncome - totalExpenses).toFixed(2)}
          </p>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <input
            placeholder="Goal name (e.g., Emergency Fund)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Target amount"
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Current saved"
              type="number"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Monthly contribution"
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleAdd}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Add Goal
          </button>
        </div>
      )}

      {goals.length === 0 && !showForm ? (
        <p className="text-gray-500 text-center py-8">No savings goals yet. Create one to start tracking!</p>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const months = monthsRemaining(goal);
            return (
              <div key={goal.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{goal.name}</h4>
                    <p className="text-sm text-gray-500">
                      ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                      {goal.monthlyContribution > 0 && ` · $${goal.monthlyContribution.toFixed(2)}/mo`}
                    </p>
                  </div>
                  <div className="text-right">
                    {months === 0 ? (
                      <span className="text-green-600 font-bold text-sm">Goal reached!</span>
                    ) : months === Infinity ? (
                      <span className="text-gray-400 text-sm">Set contribution</span>
                    ) : (
                      <span className="text-blue-600 font-bold text-sm">{months} months left</span>
                    )}
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="block text-xs text-red-400 hover:text-red-600 mt-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% complete</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

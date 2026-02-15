import { useState, useCallback, useEffect } from 'react';
import type { Transaction, SavingsGoal, TabId } from './types';
import { loadTransactions, saveTransactions, loadGoals, saveGoals, loadDismissedAnomalies, saveDismissedAnomalies } from './utils/storage';
import CSVImport from './components/CSVImport';
import SpendingByCategory from './components/SpendingByCategory';
import MonthlyTrends from './components/MonthlyTrends';
import AnomalyFlags from './components/AnomalyFlags';
import SavingsGoals from './components/SavingsGoals';
import AIAdvisor from './components/AIAdvisor';

const TABS: { id: TabId; label: string }[] = [
  { id: 'import', label: 'Import' },
  { id: 'spending', label: 'Spending' },
  { id: 'trends', label: 'Trends' },
  { id: 'anomalies', label: 'Anomalies' },
  { id: 'goals', label: 'Goals' },
  { id: 'advisor', label: 'AI Advisor' },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('import');
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [goals, setGoals] = useState<SavingsGoal[]>(loadGoals);
  const [dismissedAnomalies, setDismissedAnomalies] = useState<string[]>(loadDismissedAnomalies);

  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveGoals(goals); }, [goals]);
  useEffect(() => { saveDismissedAnomalies(dismissedAnomalies); }, [dismissedAnomalies]);

  const handleImport = useCallback((newTransactions: Transaction[]) => {
    setTransactions(prev => [...prev, ...newTransactions]);
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setDismissedAnomalies(prev => [...prev, id]);
  }, []);

  const handleUpdateGoals = useCallback((newGoals: SavingsGoal[]) => {
    setGoals(newGoals);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Budget Tracker</h1>
            {transactions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all data? This cannot be undone.')) {
                    setTransactions([]);
                    setGoals([]);
                    setDismissedAnomalies([]);
                    localStorage.clear();
                  }
                }}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Clear all data
              </button>
            )}
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'import' && (
          <CSVImport onImport={handleImport} transactionCount={transactions.length} />
        )}
        {activeTab === 'spending' && (
          <SpendingByCategory transactions={transactions} />
        )}
        {activeTab === 'trends' && (
          <MonthlyTrends transactions={transactions} />
        )}
        {activeTab === 'anomalies' && (
          <AnomalyFlags
            transactions={transactions}
            dismissedIds={dismissedAnomalies}
            onDismiss={handleDismiss}
          />
        )}
        {activeTab === 'goals' && (
          <SavingsGoals
            transactions={transactions}
            goals={goals}
            onUpdateGoals={handleUpdateGoals}
          />
        )}
        {activeTab === 'advisor' && (
          <AIAdvisor transactions={transactions} />
        )}
      </main>
    </div>
  );
}

export default App;

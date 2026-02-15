import { useMemo } from 'react';
import type { Transaction } from '../types';
import { detectAnomalies } from '../utils/anomalies';
import { getCategoryColor } from '../utils/categories';

interface Props {
  transactions: Transaction[];
  dismissedIds: string[];
  onDismiss: (id: string) => void;
}

export default function AnomalyFlags({ transactions, dismissedIds, onDismiss }: Props) {
  const anomalies = useMemo(() => {
    return detectAnomalies(transactions).filter(a => !dismissedIds.includes(a.transaction.id));
  }, [transactions, dismissedIds]);

  const getSeverity = (multiple: number) => {
    if (multiple >= 5) return { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' };
    if (multiple >= 3.5) return { label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Anomaly Flags</h3>
        <span className="text-sm text-gray-500">{anomalies.length} flagged transaction{anomalies.length !== 1 ? 's' : ''}</span>
      </div>

      <p className="text-sm text-gray-500">
        Transactions that are 2.5x or more above their category average are flagged.
      </p>

      {anomalies.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center text-green-700">
          No anomalies detected. Your spending looks consistent!
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map(({ transaction: t, multiple, categoryAvg }) => {
            const severity = getSeverity(multiple);
            return (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${severity.color}`}>
                        {severity.label}
                      </span>
                      <span className="text-sm font-bold text-red-600">{multiple}x avg</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: getCategoryColor(t.category) }}
                      >
                        {t.category}
                      </span>
                    </div>
                    <p className="font-medium text-gray-800">{t.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{t.date}</span>
                      <span>Amount: <span className="font-semibold text-red-600">${Math.abs(t.amount).toFixed(2)}</span></span>
                      <span>Category avg: <span className="font-semibold">${categoryAvg.toFixed(2)}</span></span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDismiss(t.id)}
                    className="text-gray-400 hover:text-gray-600 text-sm font-medium px-3 py-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

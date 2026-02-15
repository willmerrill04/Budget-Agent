import { useState, useMemo, useRef, useEffect } from 'react';
import type { Transaction, ChatMessage } from '../types';
import { detectAnomalies } from '../utils/anomalies';
import { loadApiKey, saveApiKey } from '../utils/storage';

interface Props {
  transactions: Transaction[];
}

function buildFinancialSummary(transactions: Transaction[]): string {
  if (transactions.length === 0) return 'No financial data available yet.';

  const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Category breakdown
  const byCategory: Record<string, number> = {};
  for (const t of transactions.filter(t => t.amount < 0)) {
    byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
  }
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
    .join(', ');

  // Monthly trends
  const byMonth: Record<string, { income: number; expenses: number }> = {};
  for (const t of transactions) {
    const m = t.date.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = { income: 0, expenses: 0 };
    if (t.amount > 0) byMonth[m].income += t.amount;
    else byMonth[m].expenses += Math.abs(t.amount);
  }
  const monthSummary = Object.entries(byMonth).sort()
    .map(([m, d]) => `${m}: income $${d.income.toFixed(0)}, expenses $${d.expenses.toFixed(0)}`)
    .join('; ');

  // Anomalies
  const anomalies = detectAnomalies(transactions).slice(0, 5);
  const anomalySummary = anomalies.length > 0
    ? anomalies.map(a => `${a.transaction.description} ($${Math.abs(a.transaction.amount).toFixed(2)}, ${a.multiple}x avg in ${a.transaction.category})`).join('; ')
    : 'None detected';

  return `Financial Summary:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net: $${(totalIncome - totalExpenses).toFixed(2)}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Transaction Count: ${transactions.length}
- Top Spending Categories: ${topCategories}
- Monthly Breakdown: ${monthSummary}
- Anomalies (unusual transactions): ${anomalySummary}`;
}

export default function AIAdvisor({ transactions }: Props) {
  const [apiKey, setApiKey] = useState(loadApiKey);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const summary = useMemo(() => buildFinancialSummary(transactions), [transactions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveKey = () => {
    saveApiKey(keyInput);
    setApiKey(keyInput);
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt = `You are a helpful personal finance advisor. The user has imported their bank transactions into a budgeting app. Here is their financial data:\n\n${summary}\n\nProvide specific, actionable advice based on their actual numbers. Be concise and practical.`;

      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const assistantContent = data.content?.[0]?.text || 'No response received.';
      setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">AI Financial Advisor</h3>

      {!apiKey ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 space-y-3">
          <p className="text-sm text-yellow-800">Enter your Anthropic API key to enable the AI advisor. Your key is stored locally and never sent to any server except the Anthropic API.</p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="sk-ant-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleSaveKey}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Save Key
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>API key configured</span>
            <button
              onClick={() => { setApiKey(''); setKeyInput(''); saveApiKey(''); }}
              className="text-red-400 hover:text-red-600"
            >
              Remove key
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 h-96 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg mb-2">Ask me about your finances</p>
                <p className="text-sm">Try: "Where am I spending the most?" or "How can I save more?"</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-400">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about your spending..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

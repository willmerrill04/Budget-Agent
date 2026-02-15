export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type TabId = 'import' | 'spending' | 'trends' | 'anomalies' | 'goals' | 'advisor';

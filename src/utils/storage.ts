import type { Transaction, SavingsGoal } from '../types';

const TRANSACTIONS_KEY = 'budget_transactions';
const GOALS_KEY = 'budget_goals';
const DISMISSED_KEY = 'budget_dismissed_anomalies';
const API_KEY_KEY = 'budget_anthropic_api_key';

export function loadTransactions(): Transaction[] {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function loadGoals(): SavingsGoal[] {
  const data = localStorage.getItem(GOALS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveGoals(goals: SavingsGoal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export function loadDismissedAnomalies(): string[] {
  const data = localStorage.getItem(DISMISSED_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveDismissedAnomalies(ids: string[]) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

export function loadApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || '';
}

export function saveApiKey(key: string) {
  localStorage.setItem(API_KEY_KEY, key);
}

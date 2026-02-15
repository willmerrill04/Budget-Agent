import { useCallback, useRef, useState } from 'react';
import type { Transaction } from '../types';
import { parseCSV } from '../utils/csv';

interface Props {
  onImport: (transactions: Transaction[]) => void;
  transactionCount: number;
}

export default function CSVImport({ onImport, transactionCount }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [lastImportCount, setLastImportCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please drop a CSV file (.csv extension required).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const transactions = parseCSV(text);
      if (transactions.length === 0) {
        setError('No transactions found. Check that your CSV has date, description, and amount columns.');
        return;
      }
      setLastImportCount(transactions.length);
      onImport(transactions);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  }, [onImport]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so re-selecting the same file triggers onChange again
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFile]);

  return (
    <div className="space-y-6">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="text-5xl mb-4">📂</div>
        <p className="text-lg font-semibold text-gray-700">
          Drag & drop your bank CSV here
        </p>
        <p className="text-sm text-gray-500 mt-2">
          or click to browse files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {lastImportCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          Successfully imported {lastImportCount} transactions. Columns were auto-detected and transactions auto-categorized.
        </div>
      )}

      {transactionCount > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
          Total transactions in database: <span className="font-bold">{transactionCount}</span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">Supported CSV format</p>
        <p>Your CSV should have columns for date, description, and amount. The importer auto-detects common column names (Date, Description, Amount, Memo, Debit, etc.).</p>
        <p className="mt-2">Negative amounts are treated as expenses, positive as income.</p>
      </div>
    </div>
  );
}

import { useCallback, useRef, useState } from 'react';
import type { Transaction } from '../types';
import { parseCSV } from '../utils/csv';
import { parsePDF } from '../utils/pdf';

interface Props {
  onImport: (transactions: Transaction[]) => void;
  transactionCount: number;
}

export default function CSVImport({ onImport, transactionCount }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [lastImportCount, setLastImportCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const finishImport = useCallback((transactions: Transaction[]) => {
    setLoading(false);
    if (transactions.length === 0) {
      setError('No transactions found. Check that your file has date, description, and amount columns.');
      return;
    }
    setLastImportCount(transactions.length);
    onImport(transactions);
  }, [onImport]);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const name = file.name.toLowerCase();
    const isCSV = name.endsWith('.csv');
    const isPDF = name.endsWith('.pdf');

    if (!isCSV && !isPDF) {
      setError('Unsupported file type. Please use a CSV or PDF file.');
      return;
    }

    if (isCSV) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        finishImport(parseCSV(text));
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
      };
      reader.readAsText(file);
    } else {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const transactions = await parsePDF(buffer);
          finishImport(transactions);
        } catch {
          setLoading(false);
          setError('Failed to parse PDF. Make sure it contains a table with transaction data.');
        }
      };
      reader.onerror = () => {
        setLoading(false);
        setError('Failed to read file. Please try again.');
      };
      reader.readAsArrayBuffer(file);
    }
  }, [finishImport]);

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
          Drag & drop your bank statement here
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Supports CSV and PDF files — or click to browse
        </p>
        {loading && (
          <p className="text-sm text-blue-600 mt-3 font-medium">
            Parsing PDF...
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.pdf"
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
        <p className="font-semibold mb-2">Supported formats</p>
        <p><strong>CSV:</strong> Should have columns for date, description, and amount. Column names are auto-detected.</p>
        <p className="mt-1"><strong>PDF:</strong> Bank statements with tabular transaction data. The importer extracts the table and auto-detects columns.</p>
        <p className="mt-2">Negative amounts are treated as expenses, positive as income.</p>
      </div>
    </div>
  );
}

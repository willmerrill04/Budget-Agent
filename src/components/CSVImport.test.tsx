import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CSVImport from './CSVImport';

// Mock pdfjs-dist since jsdom doesn't support DOMMatrix
vi.mock('../utils/pdf', () => ({
  parsePDF: vi.fn(),
}));

function createFile(content: string, name: string, type = 'text/csv'): File {
  return new File([content], name, { type });
}

function createDragEvent(file: File) {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: { files: [file] },
  };
}

const VALID_CSV = `Date,Description,Amount
2024-01-15,Walmart Grocery,-52.30
2024-01-16,Payroll Deposit,2500.00`;

describe('CSVImport', () => {
  it('renders the drop zone with instructions', () => {
    render(<CSVImport onImport={vi.fn()} transactionCount={0} />);
    expect(screen.getByText('Drag & drop your bank statement here')).toBeInTheDocument();
    expect(screen.getByText(/Supports CSV and PDF/)).toBeInTheDocument();
  });

  it('shows transaction count when transactions exist', () => {
    render(<CSVImport onImport={vi.fn()} transactionCount={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('imports CSV via file input and calls onImport', async () => {
    const onImport = vi.fn();
    render(<CSVImport onImport={onImport} transactionCount={0} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createFile(VALID_CSV, 'test.csv');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImport).toHaveBeenCalledTimes(1);
    });

    const transactions = onImport.mock.calls[0][0];
    expect(transactions).toHaveLength(2);
    expect(transactions[0].description).toBe('Walmart Grocery');
    expect(transactions[0].amount).toBe(-52.30);
    expect(transactions[1].amount).toBe(2500.00);
  });

  it('shows success message after import', async () => {
    const onImport = vi.fn();
    render(<CSVImport onImport={onImport} transactionCount={0} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [createFile(VALID_CSV, 'test.csv')] } });

    await waitFor(() => {
      expect(screen.getByText(/Successfully imported 2 transactions/)).toBeInTheDocument();
    });
  });

  it('handles drag enter/over/leave cycle correctly', () => {
    render(<CSVImport onImport={vi.fn()} transactionCount={0} />);
    const dropZone = screen.getByText('Drag & drop your bank statement here').closest('div')!;

    // Drag enter on parent
    fireEvent.dragEnter(dropZone, createDragEvent(createFile('', 'test.csv')));
    expect(dropZone).toHaveClass('border-blue-500');

    // Drag enter on child (counter increments to 2)
    fireEvent.dragEnter(dropZone, createDragEvent(createFile('', 'test.csv')));
    expect(dropZone).toHaveClass('border-blue-500');

    // Drag leave from child (counter decrements to 1, should still be highlighted)
    fireEvent.dragLeave(dropZone, createDragEvent(createFile('', 'test.csv')));
    expect(dropZone).toHaveClass('border-blue-500');

    // Drag leave from parent (counter decrements to 0, highlight removed)
    fireEvent.dragLeave(dropZone, createDragEvent(createFile('', 'test.csv')));
    expect(dropZone).not.toHaveClass('border-blue-500');
  });

  it('handles drop event and processes CSV file', async () => {
    const onImport = vi.fn();
    render(<CSVImport onImport={onImport} transactionCount={0} />);
    const dropZone = screen.getByText('Drag & drop your bank statement here').closest('div')!;

    const file = createFile(VALID_CSV, 'transactions.csv');
    fireEvent.drop(dropZone, createDragEvent(file));

    await waitFor(() => {
      expect(onImport).toHaveBeenCalledTimes(1);
    });
    expect(onImport.mock.calls[0][0]).toHaveLength(2);
  });

  it('resets drag highlight on drop', () => {
    render(<CSVImport onImport={vi.fn()} transactionCount={0} />);
    const dropZone = screen.getByText('Drag & drop your bank statement here').closest('div')!;

    // Enter drag state
    fireEvent.dragEnter(dropZone, createDragEvent(createFile('', 'test.csv')));
    expect(dropZone).toHaveClass('border-blue-500');

    // Drop resets
    fireEvent.drop(dropZone, createDragEvent(createFile(VALID_CSV, 'test.csv')));
    expect(dropZone).not.toHaveClass('border-blue-500');
  });

  it('shows error for unsupported file types', async () => {
    render(<CSVImport onImport={vi.fn()} transactionCount={0} />);
    const dropZone = screen.getByText('Drag & drop your bank statement here').closest('div')!;

    const file = createFile('not csv', 'image.png', 'image/png');
    fireEvent.drop(dropZone, createDragEvent(file));

    await waitFor(() => {
      expect(screen.getByText(/Unsupported file type/)).toBeInTheDocument();
    });
  });

  it('shows error when CSV has no parseable transactions', async () => {
    const badCSV = `Date,Description,Amount`;
    render(<CSVImport onImport={vi.fn()} transactionCount={0} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [createFile(badCSV, 'empty.csv')] } });

    await waitFor(() => {
      expect(screen.getByText(/No transactions found/)).toBeInTheDocument();
    });
  });

  it('clears error on successful import', async () => {
    const onImport = vi.fn();
    render(<CSVImport onImport={onImport} transactionCount={0} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // First: bad import
    fireEvent.change(input, { target: { files: [createFile('Date,Description,Amount', 'bad.csv')] } });
    await waitFor(() => {
      expect(screen.getByText(/No transactions found/)).toBeInTheDocument();
    });

    // Then: good import clears error
    fireEvent.change(input, { target: { files: [createFile(VALID_CSV, 'good.csv')] } });
    await waitFor(() => {
      expect(screen.queryByText(/No transactions found/)).not.toBeInTheDocument();
    });
  });

  it('opens file dialog on click', () => {
    render(<CSVImport onImport={vi.fn()} transactionCount={0} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    const dropZone = screen.getByText('Drag & drop your bank statement here').closest('div')!;
    fireEvent.click(dropZone);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('accepts .pdf files in the file input', () => {
    render(<CSVImport onImport={vi.fn()} transactionCount={0} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('.csv,.pdf');
  });
});

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ColumnMetadata } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export function generateMockData(count: number): any[] {
  const products = ['Widget A', 'Gadget B', 'Device C', 'System X', 'Module Y'];
  const customers = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Acme Corp'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `REC-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
    order_id: i + 1,
    customer_name: customers[Math.floor(Math.random() * customers.length)],
    order_date: new Date(2025, 10, Math.floor(Math.random() * 20) + 1).toISOString().replace('T', ' ').substring(0, 19),
    amount: parseFloat((Math.random() * 500 + 50).toFixed(2)),
    product: products[Math.floor(Math.random() * products.length)],
    status: 'raw'
  }));
}

/**
 * Parses raw CSV string into an array of objects
 */
export function parseCSV(text: string): Record<string, any>[] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++; // skip double quote escape
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell.trim());
      if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
        lines.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  
  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
      lines.push(row);
    }
  }
  
  if (lines.length === 0) return [];
  
  // Extract headers
  const headers = lines[0].map(h => h.replace(/^["']|["']$/g, '').trim());
  const records: Record<string, any>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const record: Record<string, any> = {};
    let hasValues = false;
    
    for (let j = 0; j < headers.length; j++) {
      const val = line[j] !== undefined ? line[j] : '';
      if (val !== '') hasValues = true;
      
      // Auto cast numbers and booleans
      if (val === '') {
        record[headers[j]] = '';
      } else if (!isNaN(Number(val)) && val.trim() !== '') {
        record[headers[j]] = Number(val);
      } else if (val.toLowerCase() === 'true') {
        record[headers[j]] = true;
      } else if (val.toLowerCase() === 'false') {
        record[headers[j]] = false;
      } else {
        record[headers[j]] = val;
      }
    }
    
    if (hasValues) {
      records.push(record);
    }
  }
  
  return records;
}

/**
 * Detects column metadata and types (numeric, date, categorical, string)
 */
export function detectColumns(data: Record<string, any>[]): ColumnMetadata[] {
  if (data.length === 0) return [];
  
  // Extract all unique keys except internal status and id fields
  const keys = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'status');
  
  return keys.map(key => {
    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let stringCount = 0;
    let populatedCount = 0;
    
    const sample = data.slice(0, Math.min(data.length, 100));
    sample.forEach(row => {
      const val = row[key];
      if (val === undefined || val === null || val === '') return;
      populatedCount++;
      
      if (typeof val === 'number') {
        numericCount++;
      } else if (typeof val === 'boolean') {
        booleanCount++;
      } else if (typeof val === 'string') {
        if (!isNaN(Number(val)) && val.trim() !== '') {
          numericCount++;
        } else {
          // Date heuristic (checks standard parse and separator markers)
          const isDate = !isNaN(Date.parse(val)) && 
                         (val.includes('-') || val.includes('/') || val.includes(':')) &&
                         isNaN(Number(val));
          if (isDate) {
            dateCount++;
          } else {
            stringCount++;
          }
        }
      }
    });
    
    let inferredType: ColumnMetadata['type'] = 'string';
    
    if (populatedCount > 0) {
      if (numericCount / populatedCount > 0.6) {
        inferredType = 'numeric';
      } else if (dateCount / populatedCount > 0.6) {
        inferredType = 'date';
      } else if (booleanCount / populatedCount > 0.6) {
        inferredType = 'categorical';
      } else {
        // Categorical heuristic: low number of unique values relative to sample size
        const uniqueVals = new Set(sample.map(r => r[key]).filter(v => v !== undefined && v !== null && v !== ''));
        if (uniqueVals.size <= Math.max(3, Math.min(sample.length * 0.2, 15))) {
          inferredType = 'categorical';
        } else {
          inferredType = 'string';
        }
      }
    }
    
    return { key, type: inferredType };
  });
}


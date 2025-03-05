
import { flattenData } from "./dataUtils";

// Export to CSV
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  const flattenedData = flattenData(data);
  
  const headers: string[] = Array.from(
    new Set(
      flattenedData.flatMap(obj => Object.keys(obj))
    )
  );
  
  const csvContent = [
    headers.join(','),
    ...flattenedData.map(row => 
      headers.map(header => {
        // Fix: Handle undefined values properly before trying to use string methods
        const val = row[header] !== undefined ? row[header] : '';
        // Only try to escape if it's a string
        const escaped = typeof val === 'string' ? 
          (val.includes(',') || val.includes('"') || val.includes('\n')) 
            ? `"${val.replace(/"/g, '""')}"` 
            : val
          : val; // If not a string, don't try to escape it
        return escaped;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

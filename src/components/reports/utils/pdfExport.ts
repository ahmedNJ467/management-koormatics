
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateTableData } from "./pdf/tableFormatters";
import { drawPdfHeader } from "./pdf/pdfHeader";
import { getTableConfig } from "./pdf/pdfTableConfig";
import { pdfConfig } from "./pdf/pdfStyles";

// Export to PDF with modern UI and color scheme
export const exportToPDF = (data: any[], title: string, filename: string) => {
  if (!data || data.length === 0) return;
  
  const doc = new jsPDF({
    orientation: pdfConfig.orientation,
    unit: 'in',
    format: pdfConfig.format
  });
  
  // Draw the document header
  drawPdfHeader(doc, title);
  
  // Generate table data based on report type
  const { tableHeaders, tableData } = generateTableData(data, filename);

  // Create a modern styled table with configuration
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    ...getTableConfig(data, filename, 2.0)
  });
  
  doc.save(`${filename}.pdf`);
};

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toShortId } from "@/utils/ids";
import QRCode from "qrcode";

export interface IncidentReportForPdf {
  id: string;
  incident_date: string;
  incident_time?: string;
  incident_type: string;
  severity: "minor" | "moderate" | "severe" | "critical";
  status: "reported" | "investigating" | "resolved" | "closed";
  location: string;
  description: string;
  injuries_reported: boolean;
  third_party_involved: boolean;
  photos_attached: boolean;
  police_report_number?: string;
  insurance_claim_number?: string;
  estimated_damage_cost?: number;
  actual_repair_cost?: number;
  third_party_details?: string;
  witness_details?: string;
  reported_by: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  notes?: string;
  // Optional photos to embed in the PDF
  photos?: Array<{
    url: string;
    name?: string;
  }>;

  created_at: string;
  updated_at: string;
  vehicle?: {
    make?: string;
    model?: string;
    registration?: string;
  };
  driver?: {
    name?: string;
    license_number?: string;
  };
}

// Helper function to load image as data URL
async function loadImageAsDataURL(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading image:", error);
    return "";
  }
}

// Helper function to format boolean values (avoid unicode glyphs that may not render)
function formatBoolean(value: boolean | undefined): string {
  if (value === undefined || value === null) return "-";
  return value ? "Yes" : "No";
}

// International (ISO 8601) date formatting
function formatISODate(value?: string): string {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toISOString().slice(0, 10);
  } catch {
    return value;
  }
}

// Helper to format currency with locale/currency options
function formatCurrency(
  value?: number,
  opts: { locale?: string; currency?: string } = {}
): string {
  if (value === undefined || value === null) return "-";
  const locale = opts.locale || "en-US";
  const currency = opts.currency || "USD";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

// Helper function to format severity with color coding
function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "minor":
      return "#28A745"; // Green
    case "moderate":
      return "#FFC107"; // Yellow
    case "severe":
      return "#FF6C37"; // Orange
    case "critical":
      return "#DC3545"; // Red
    default:
      return "#6C757D"; // Gray
  }
}

// Helper function to format status with color coding
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "reported":
      return "#6C757D"; // Gray
    case "investigating":
      return "#FFC107"; // Yellow
    case "resolved":
      return "#28A745"; // Green
    case "closed":
      return "#6C757D"; // Gray
    default:
      return "#6C757D"; // Gray
  }
}

// Convert hex color (#RRGGBB) to rgb tuple used by jspdf-autotable
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

export async function generateIncidentReportPdf(
  incident: IncidentReportForPdf,
  options?: {
    logoUrl?: string;
    companyName?: string;
    companyAddress?: string;
    reportUrl?: string; // link to the incident in the app
    locale?: string; // e.g., 'en-GB'
    currency?: string; // e.g., 'USD', 'EUR'
    preparedBy?: string;
  }
): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const brandPrimary = "#2E4A87"; // Koormatics blue tone
  const brandAccent = "#7AC943"; // Koormatics green tone

  // Document metadata (helps international exchange/archiving)
  doc.setProperties({
    title: `Vehicle Incident Report ${toShortId(incident.id, 8)}`,
    subject: "Vehicle Incident Report",
    author: options?.companyName || "Koormatics",
    keywords: "Incident, Vehicle, Report, Koormatics",
    creator: "Koormatics System",
  } as any);

  // Header
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const headerHeight = 80;

  let logoDataUrl: string | null = null;
  if (options?.logoUrl) {
    logoDataUrl = await loadImageAsDataURL(options.logoUrl);
  }

  // Top band
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, headerHeight, "F");
  if (logoDataUrl) {
    const logoWidth = 160;
    const logoHeight = 42;
    doc.addImage(logoDataUrl, "PNG", marginX, 22, logoWidth, logoHeight);
  }

  // Company/title block on right
  doc.setTextColor(brandPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Vehicle Incident Report", pageWidth - marginX, 30, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    options?.companyName || "Koormatics Fleet Management",
    pageWidth - marginX,
    48,
    { align: "right" }
  );
  if (options?.companyAddress) {
    doc.text(options.companyAddress, pageWidth - marginX, 64, {
      align: "right",
    });
  }

  // Divider
  doc.setDrawColor(brandAccent);
  doc.setFillColor(brandAccent);
  doc.rect(marginX, headerHeight - 4, pageWidth - marginX * 2, 2, "F");

  let yCursor = headerHeight + 20; // badges removed; severity/status will be highlighted in table

  // Overview table (two columns) - bold field labels
  autoTable(doc, {
    startY: yCursor,
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: marginX, right: marginX },
    body: [
      [
        "Incident ID",
        toShortId(incident.id, 8),
        "Reported By",
        incident.reported_by || "-",
      ],
      [
        "Date",
        formatISODate(incident.incident_date),
        "Time",
        incident.incident_time || "-",
      ],
      [
        "Vehicle",
        `${incident.vehicle?.make || ""} ${
          incident.vehicle?.model || ""
        }`.trim() || "-",
        "Registration",
        incident.vehicle?.registration || "-",
      ],
      [
        "Driver",
        incident.driver?.name || "-",
        "License",
        incident.driver?.license_number || "-",
      ],
      ["Location", incident.location || "-", "", ""],
    ],
    showHead: "never",
    theme: "grid",
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 120 },
      1: { cellWidth: (pageWidth - marginX * 2) / 2 - 120 },
      2: { fontStyle: "bold", cellWidth: 120 },
      3: { cellWidth: (pageWidth - marginX * 2) / 2 - 120 },
    },
  } as any);
  yCursor = (doc as any).lastAutoTable.finalY + 16;

  // Incident classification table
  autoTable(doc, {
    startY: yCursor,
    head: [["Classification", "Details"]],
    body: [
      ["Type", (incident.incident_type || "-").toString().toUpperCase()],
      ["Severity", (incident.severity || "-").toString().toUpperCase()],
      ["Status", (incident.status || "-").toString().toUpperCase()],
    ],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: brandPrimary, textColor: 255 },
    theme: "grid",
    didParseCell: (data: any) => {
      if (data.section === "body" && data.column.index === 1) {
        const label = data.row.raw?.[0];
        if (label === "Severity") {
          const [r, g, b] = hexToRgb(getSeverityColor(incident.severity || ""));
          data.cell.styles.fillColor = [r, g, b];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
        if (label === "Status") {
          const [r, g, b] = hexToRgb(getStatusColor(incident.status || ""));
          data.cell.styles.fillColor = [r, g, b];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: marginX, right: marginX },
  });
  yCursor = (doc as any).lastAutoTable.finalY + 16;

  // Incident details table
  autoTable(doc, {
    startY: yCursor,
    head: [["Incident Details", "Status"]],
    body: [
      ["Injuries Reported", formatBoolean(incident.injuries_reported)],
      ["Third Party Involved", formatBoolean(incident.third_party_involved)],
      ["Photos Attached", formatBoolean(incident.photos_attached)],
      ["Follow-up Required", formatBoolean(incident.follow_up_required)],
      ["Follow-up Date", formatISODate(incident.follow_up_date)],
    ],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: brandPrimary, textColor: 255 },
    theme: "striped",
    margin: { left: marginX, right: marginX },
  });
  yCursor = (doc as any).lastAutoTable.finalY + 16;

  // Financial & reference info
  const financialData: Array<[string, string]> = [];
  if (incident.estimated_damage_cost !== undefined) {
    financialData.push([
      "Estimated Damage Cost",
      formatCurrency(incident.estimated_damage_cost, {
        locale: options?.locale,
        currency: options?.currency,
      }),
    ]);
  }
  if (incident.actual_repair_cost !== undefined) {
    financialData.push([
      "Actual Repair Cost",
      formatCurrency(incident.actual_repair_cost, {
        locale: options?.locale,
        currency: options?.currency,
      }),
    ]);
  }
  if (incident.police_report_number) {
    financialData.push(["Police Report Number", incident.police_report_number]);
  }
  if (incident.insurance_claim_number) {
    financialData.push([
      "Insurance Claim Number",
      incident.insurance_claim_number,
    ]);
  }

  if (financialData.length > 0) {
    autoTable(doc, {
      startY: yCursor,
      head: [["Financial & Reference Information", "Details"]],
      body: financialData,
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: brandPrimary, textColor: 255 },
      theme: "grid",
      margin: { left: marginX, right: marginX },
    });
    yCursor = (doc as any).lastAutoTable.finalY + 16;
  }

  // Description section
  if (incident.description) {
    autoTable(doc, {
      startY: yCursor,
      head: [["Incident Description"]],
      body: [[incident.description]],
      styles: { fontSize: 10, cellPadding: 8, valign: "top" },
      headStyles: { fillColor: brandPrimary, textColor: 255, halign: "left" },
      columnStyles: { 0: { cellWidth: pageWidth - marginX * 2 } },
      theme: "grid",
      margin: { left: marginX, right: marginX },
    });
    yCursor = (doc as any).lastAutoTable.finalY + 16;
  }

  // Additional details section
  const additionalDetails: Array<[string, string]> = [];
  if (incident.third_party_details) {
    additionalDetails.push([
      "Third Party Details",
      incident.third_party_details,
    ]);
  }
  if (incident.witness_details) {
    additionalDetails.push(["Witness Details", incident.witness_details]);
  }
  if (incident.notes) {
    additionalDetails.push(["Additional Notes", incident.notes]);
  }

  if (additionalDetails.length > 0) {
    autoTable(doc, {
      startY: yCursor,
      head: [["Additional Information", "Details"]],
      body: additionalDetails,
      styles: { fontSize: 9, cellPadding: 6, valign: "top" },
      headStyles: { fillColor: brandPrimary, textColor: 255 },
      theme: "grid",
      margin: { left: marginX, right: marginX },
    });
    yCursor = (doc as any).lastAutoTable.finalY + 16;
  }

  // Photos section (optional)
  if (incident.photos && incident.photos.length > 0) {
    doc.setTextColor(brandPrimary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Evidence Photos", marginX, yCursor);
    yCursor += 10;

    const toDataUrl = async (url: string): Promise<string> => {
      if (!url) return "";
      if (url.startsWith("data:")) return url;
      return await loadImageAsDataURL(url);
    };

    const dataUrls = await Promise.all(
      incident.photos.map((p) => toDataUrl(p.url))
    );

    const imagesPerRow = 3;
    const gap = 8;
    const usableWidth = pageWidth - marginX * 2;
    const imageWidth = (usableWidth - gap * (imagesPerRow - 1)) / imagesPerRow;
    const imageHeight = imageWidth * 0.75; // 4:3 ratio
    const captionHeight = 12;
    const rowHeight = imageHeight + captionHeight + 6;
    const bottomSafeY = doc.internal.pageSize.getHeight() - 120; // leave space for footer

    const getType = (dataUrl: string): "PNG" | "JPEG" =>
      dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";

    let col = 0;
    for (let i = 0; i < dataUrls.length; i++) {
      const dataUrl = dataUrls[i];
      if (!dataUrl) continue;

      if (yCursor + rowHeight > bottomSafeY) {
        doc.addPage();
        yCursor = 36;
      }

      const x = marginX + col * (imageWidth + gap);
      const y = yCursor;
      try {
        doc.addImage(dataUrl, getType(dataUrl), x, y, imageWidth, imageHeight);
      } catch {
        // ignore image add failure
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(60);
      const name = incident.photos[i]?.name || `Photo ${i + 1}`;
      const maxChars = 40;
      const caption =
        name.length > maxChars ? name.slice(0, maxChars - 1) + "…" : name;
      doc.text(caption, x, y + imageHeight + 10, { maxWidth: imageWidth });

      col++;
      if (col >= imagesPerRow) {
        col = 0;
        yCursor += rowHeight + gap;
      }
    }

    if (col !== 0) {
      yCursor += rowHeight + gap;
    }
  }

  // QR code (optional) and signature/footer area
  let qrDataUrl: string | undefined;
  if (options?.reportUrl) {
    try {
      qrDataUrl = await QRCode.toDataURL(options.reportUrl, {
        margin: 0,
        width: 96,
      });
    } catch {
      // ignore QR generation error
    }
  }

  const footerY = pageHeight - 96;
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", marginX, footerY - 8, 80, 80);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("Scan for digital record", marginX + 2, footerY + 78);
    } catch {}
  }

  // Signature lines — non-overlapping, account for optional QR
  const reservedLeft = qrDataUrl ? 96 + 16 : 0; // QR width + gap
  const sigWidth = 220;
  const leftX = marginX + reservedLeft;
  const rightX = pageWidth - marginX - sigWidth;

  doc.setDrawColor(brandPrimary);
  doc.line(leftX, footerY, leftX + sigWidth, footerY);
  doc.line(rightX, footerY, rightX + sigWidth, footerY);
  doc.setFontSize(9);
  doc.setTextColor(40);
  doc.text("Reporter Signature", leftX + sigWidth / 2, footerY + 14, {
    align: "center",
  });
  doc.text("Manager Approval", rightX + sigWidth / 2, footerY + 14, {
    align: "center",
  });
  if (options?.preparedBy) {
    doc.text(`Prepared by: ${options.preparedBy}`, marginX + 100, footerY + 28);
  }

  // Page numbers and footer note on each page
  const pageCount = (doc as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    (doc as any).setPage(i);
    const footerNoteY = pageHeight - 24;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Page ${i} of ${pageCount} • Generated ${new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ")}`,
      pageWidth / 2,
      footerNoteY,
      { align: "center" }
    );
  }

  const filenameParts = [
    "incident-report",
    incident.vehicle?.registration || "vehicle",
    formatISODate(incident.incident_date) || "date",
    toShortId(incident.id, 8),
  ];
  const fileName = filenameParts.filter(Boolean).join("-") + ".pdf";
  doc.save(fileName);
}

// Export multiple incident reports as summary table
export async function exportIncidentReportsListToPDF(
  incidents: IncidentReportForPdf[]
): Promise<void> {
  if (!incidents || incidents.length === 0) {
    throw new Error("No incident reports available to export");
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const brandPrimary = "#2E4A87";
  const brandAccent = "#7AC943";
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const headerHeight = 72;

  // Header
  doc.setFillColor(brandPrimary);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  // Company logo and title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Incident Reports Summary", pageWidth / 2, 36, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Koormatics Fleet Management", pageWidth / 2, 56, {
    align: "center",
  });

  // Divider
  doc.setFillColor(brandAccent);
  doc.rect(marginX, headerHeight, pageWidth - marginX * 2, 2, "F");

  let yCursor = headerHeight + 24;

  // Summary statistics
  const totalIncidents = incidents.length;
  const criticalIncidents = incidents.filter(
    (i) => i.severity === "critical"
  ).length;
  const severeIncidents = incidents.filter(
    (i) => i.severity === "severe"
  ).length;
  const totalCost = incidents.reduce(
    (sum, i) => sum + (i.actual_repair_cost || 0),
    0
  );

  autoTable(doc, {
    startY: yCursor,
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: brandPrimary, textColor: 255 },
    body: [
      ["Total Incidents", totalIncidents.toString()],
      ["Critical Incidents", criticalIncidents.toString()],
      ["Severe Incidents", severeIncidents.toString()],
      ["Total Repair Cost", formatCurrency(totalCost)],
    ],
    columns: [
      { header: "Metric", dataKey: "metric" },
      { header: "Value", dataKey: "value" },
    ],
    theme: "grid",
  } as any);
  yCursor = (doc as any).lastAutoTable.finalY + 16;

  // Generate summary table
  const tableData = incidents.map((incident) => [
    formatISODate(incident.incident_date),
    incident.vehicle
      ? `${incident.vehicle.make || ""} ${incident.vehicle.model || ""}`.trim()
      : "N/A",
    (incident.incident_type || "-").toString().toUpperCase(),
    (incident.severity || "-").toString().toUpperCase(),
    (incident.status || "-").toString().toUpperCase(),
    incident.location.length > 30
      ? incident.location.substring(0, 30) + "..."
      : incident.location,
    incident.estimated_damage_cost
      ? formatCurrency(incident.estimated_damage_cost)
      : "N/A",
    incident.reported_by || "-",
  ]);

  const headers = [
    "Date",
    "Vehicle",
    "Type",
    "Severity",
    "Status",
    "Location",
    "Est. Cost",
    "Reported By",
  ];

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: yCursor,
    margin: { left: marginX, right: marginX },
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      textColor: [40, 40, 40],
      font: "helvetica",
      valign: "middle",
    },
    headStyles: {
      fillColor: [brandPrimary],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 60, halign: "center" },
      1: { cellWidth: 100, halign: "left" },
      2: { cellWidth: 60, halign: "center" },
      3: { cellWidth: 60, halign: "center" },
      4: { cellWidth: 70, halign: "center" },
      5: { cellWidth: 130, halign: "left" },
      6: { cellWidth: 70, halign: "right" },
      7: { cellWidth: 90, halign: "left" },
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  });

  // Footer page numbers
  const pageCount = (doc as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    (doc as any).setPage(i);
    const footerY = pageHeight - 24;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, footerY, {
      align: "center",
    });
  }

  const filename = `incident-reports-summary-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(filename);
}

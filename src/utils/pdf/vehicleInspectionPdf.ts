import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toShortId } from "@/utils/ids";
import QRCode from "qrcode";

export interface VehicleInspectionForPdf {
  id: string;
  inspection_date: string;
  inspector_name: string;
  overall_status: "pass" | "fail" | "conditional" | string;
  mileage?: number;
  fuel_level?: number;
  pre_trip?: boolean;
  post_trip?: boolean;
  engine_oil?: string;
  coolant?: string;
  brake_fluid?: string;
  tires_condition?: string;
  lights_working?: boolean;
  brakes_working?: boolean;
  steering_working?: boolean;
  horn_working?: boolean;
  wipers_working?: boolean;
  mirrors_clean?: boolean;
  seatbelts_working?: boolean;
  first_aid_kit?: boolean;
  fire_extinguisher?: boolean;
  warning_triangle?: boolean;
  jack_spare_tire?: boolean;
  documents_present?: boolean;
  interior_clean?: boolean;
  exterior_clean?: boolean;
  defects_noted?: string;
  corrective_actions?: string;
  notes?: string;
  vehicle?: {
    make?: string;
    model?: string;
    registration?: string;
  };
}

async function loadImageAsDataURL(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatBoolean(value: boolean | undefined): string {
  return value ? "Yes" : value === false ? "No" : "-";
}

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

function getInspectionStatusColor(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "pass":
      return "#28A745"; // green
    case "fail":
      return "#DC3545"; // red
    case "conditional":
      return "#FFC107"; // yellow
    default:
      return "#6C757D"; // gray
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

export async function generateVehicleInspectionPdf(
  inspection: VehicleInspectionForPdf,
  options?: {
    logoUrl?: string;
    companyName?: string;
    companyAddress?: string;
    reportUrl?: string;
    preparedBy?: string;
  }
): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const brandPrimary = "#2E4A87"; // Koormatics blue tone
  const brandAccent = "#7AC943"; // Koormatics green tone

  // Metadata
  doc.setProperties({
    title: `Vehicle Inspection ${toShortId(inspection.id, 8)}`,
    subject: "Vehicle Inspection Report",
    author: options?.companyName || "Koormatics",
    keywords: "Vehicle, Inspection, Report, Koormatics",
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

  // Header band and logo
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
  doc.text("Vehicle Inspection Report", pageWidth - marginX, 30, {
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

  let yCursor = headerHeight + 20;

  // Overview table (two columns)
  autoTable(doc, {
    startY: yCursor,
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: marginX, right: marginX },
    body: [
      [
        "Inspection ID",
        toShortId(inspection.id, 8),
        "Status",
        (inspection.overall_status || "-").toString().toUpperCase(),
      ],
      [
        "Date",
        formatISODate(inspection.inspection_date),
        "Inspector",
        inspection.inspector_name || "-",
      ],
      [
        "Vehicle",
        `${inspection.vehicle?.make || ""} ${
          inspection.vehicle?.model || ""
        }`.trim() || "-",
        "Registration",
        inspection.vehicle?.registration || "-",
      ],
      [
        "Mileage",
        inspection.mileage != null
          ? `${inspection.mileage.toLocaleString()} km`
          : "-",
        "Fuel Level",
        inspection.fuel_level != null ? `${inspection.fuel_level}%` : "-",
      ],
    ],
    showHead: "never",
    theme: "grid",
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 120 },
      1: { cellWidth: (pageWidth - marginX * 2) / 2 - 120 },
      2: { fontStyle: "bold", cellWidth: 120 },
      3: { cellWidth: (pageWidth - marginX * 2) / 2 - 120 },
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.column.index === 1) {
        const label = data.row.raw?.[0];
        if (label === "Status") {
          const [r, g, b] = hexToRgb(
            getInspectionStatusColor(inspection.overall_status || "")
          );
          data.cell.styles.fillColor = [r, g, b];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  } as any);
  yCursor = (doc as any).lastAutoTable.finalY + 16;

  // Checklist summary
  autoTable(doc, {
    startY: yCursor,
    head: [["Checklist Item", "Result"]],
    body: [
      ["Pre-trip", formatBoolean(inspection.pre_trip)],
      ["Post-trip", formatBoolean(inspection.post_trip)],
      ["Lights working", formatBoolean(inspection.lights_working)],
      ["Brakes working", formatBoolean(inspection.brakes_working)],
      ["Steering working", formatBoolean(inspection.steering_working)],
      ["Horn working", formatBoolean(inspection.horn_working)],
      ["Wipers working", formatBoolean(inspection.wipers_working)],
      ["Mirrors clean", formatBoolean(inspection.mirrors_clean)],
      ["Seatbelts working", formatBoolean(inspection.seatbelts_working)],
      ["First aid kit", formatBoolean(inspection.first_aid_kit)],
      ["Fire extinguisher", formatBoolean(inspection.fire_extinguisher)],
      ["Warning triangle", formatBoolean(inspection.warning_triangle)],
      ["Jack & spare tire", formatBoolean(inspection.jack_spare_tire)],
      ["Documents present", formatBoolean(inspection.documents_present)],
      ["Interior clean", formatBoolean(inspection.interior_clean)],
      ["Exterior clean", formatBoolean(inspection.exterior_clean)],
    ],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: brandPrimary, textColor: 255 },
    theme: "striped",
    margin: { left: marginX, right: marginX },
  });
  yCursor = (doc as any).lastAutoTable.finalY + 16;

  // Fluids/levels table
  autoTable(doc, {
    startY: yCursor,
    head: [["Fluids / Levels", "Status"]],
    body: [
      ["Engine oil", inspection.engine_oil || "-"],
      ["Coolant", inspection.coolant || "-"],
      ["Brake fluid", inspection.brake_fluid || "-"],
      ["Tires condition", inspection.tires_condition || "-"],
    ],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: brandPrimary, textColor: 255 },
    theme: "grid",
    margin: { left: marginX, right: marginX },
  });
  yCursor = (doc as any).lastAutoTable.finalY + 16;

  // Notes & Actions
  const notesText = [
    inspection.defects_noted
      ? `Defects noted: ${inspection.defects_noted}`
      : "",
    inspection.corrective_actions
      ? `Corrective actions: ${inspection.corrective_actions}`
      : "",
    inspection.notes ? `Additional notes: ${inspection.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  autoTable(doc, {
    startY: yCursor,
    head: [["Notes & Actions"]],
    body: [[notesText || "No additional notes."]],
    styles: { fontSize: 10, cellPadding: 8, valign: "top" },
    headStyles: { fillColor: brandPrimary, textColor: 255, halign: "left" },
    columnStyles: { 0: { cellWidth: pageWidth - marginX * 2 } },
    theme: "grid",
    margin: { left: marginX, right: marginX },
  });
  yCursor = (doc as any).lastAutoTable.finalY + 20;

  // Ensure space for signature block; add page if needed
  const minSignatureBlock = 140; // space needed for QR + signatures
  if (
    (doc as any).lastAutoTable &&
    (doc as any).lastAutoTable.finalY + minSignatureBlock > pageHeight
  ) {
    doc.addPage();
    yCursor = 36;
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
      // ignore
    }
  }

  const footerY = doc.internal.pageSize.getHeight() - 96;
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", marginX, footerY - 8, 80, 80);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("Scan for digital record", marginX + 2, footerY + 78);
    } catch {}
  }

  // Signature lines
  const reservedLeft = qrDataUrl ? 96 + 16 : 0; // QR width + gap
  const sigWidth = 220;
  const leftX = marginX + reservedLeft;
  const rightX = doc.internal.pageSize.getWidth() - marginX - sigWidth;

  doc.setDrawColor(brandPrimary);
  doc.line(leftX, footerY, leftX + sigWidth, footerY);
  doc.line(rightX, footerY, rightX + sigWidth, footerY);
  doc.setFontSize(9);
  doc.setTextColor(40);
  doc.text("Inspector Signature", leftX + sigWidth / 2, footerY + 14, {
    align: "center",
  });
  doc.text("Manager Approval", rightX + sigWidth / 2, footerY + 14, {
    align: "center",
  });
  if (options?.preparedBy) {
    doc.text(`Prepared by: ${options.preparedBy}`, leftX, footerY + 28);
  }

  // Page numbers
  const pageCount = (doc as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    (doc as any).setPage(i);
    const footY = doc.internal.pageSize.getHeight() - 24;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Page ${i} of ${pageCount} • Generated ${new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ")}`,
      doc.internal.pageSize.getWidth() / 2,
      footY,
      { align: "center" }
    );
  }

  const filenameParts = [
    "inspection",
    inspection.vehicle?.registration || "vehicle",
    formatISODate(inspection.inspection_date) || "date",
    toShortId(inspection.id, 8),
  ];
  const fileName = filenameParts.filter(Boolean).join("-") + ".pdf";
  doc.save(fileName);
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toShortId } from "@/utils/ids";

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

export async function generateVehicleInspectionPdf(
  inspection: VehicleInspectionForPdf,
  options?: { logoUrl?: string }
): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const brandPrimary = "#2E4A87"; // Koormatics blue tone
  const brandAccent = "#7AC943"; // Koormatics green tone

  // Header
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 36;
  const headerHeight = 72;

  let logoDataUrl: string | null = null;
  if (options?.logoUrl) {
    logoDataUrl = await loadImageAsDataURL(options.logoUrl);
  }

  if (logoDataUrl) {
    // Draw logo on left
    const logoWidth = 160;
    const logoHeight = 42;
    doc.addImage(logoDataUrl, "PNG", marginX, 24, logoWidth, logoHeight);
  }

  // Company/title block on right
  doc.setTextColor(brandPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Vehicle Inspection Report", pageWidth - marginX, 36, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Koormatics Fleet Management", pageWidth - marginX, 56, {
    align: "right",
  });

  // Divider
  doc.setDrawColor(brandAccent);
  doc.setFillColor(brandAccent);
  doc.rect(marginX, headerHeight, pageWidth - marginX * 2, 2, "F");

  let yCursor = headerHeight + 24;

  // Overview table (two columns)
  autoTable(doc, {
    startY: yCursor,
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: brandPrimary, textColor: 255 },
    body: [
      [
        "Inspection ID",
        toShortId(inspection.id, 8),
        "Status",
        (inspection.overall_status || "-").toString().toUpperCase(),
      ],
      [
        "Date",
        inspection.inspection_date
          ? new Date(inspection.inspection_date).toLocaleDateString()
          : "-",
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
    columns: [
      { header: "Field", dataKey: "k1" },
      { header: "Value", dataKey: "v1" },
      { header: "Field", dataKey: "k2" },
      { header: "Value", dataKey: "v2" },
    ],
    theme: "grid",
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
  });
  yCursor = (doc as any).lastAutoTable.finalY + 16;

  // Notes section
  // Notes & Actions using autoTable to avoid overlap/pagination issues
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

  // Footer signature area
  const footerY = doc.internal.pageSize.getHeight() - 96;
  doc.setDrawColor(brandPrimary);
  doc.line(marginX, footerY, marginX + 180, footerY);
  doc.line(pageWidth - marginX - 180, footerY, pageWidth - marginX, footerY);
  doc.setFontSize(9);
  doc.text("Inspector Signature", marginX, footerY + 14);
  doc.text("Manager Approval", pageWidth - marginX - 180, footerY + 14);

  const filenameParts = [
    "inspection",
    inspection.vehicle?.registration || "vehicle",
    inspection.inspection_date?.slice(0, 10) || "date",
    toShortId(inspection.id, 8),
  ];
  const fileName = filenameParts.filter(Boolean).join("-") + ".pdf";
  doc.save(fileName);
}

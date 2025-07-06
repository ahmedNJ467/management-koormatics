import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { format } from "date-fns";
import { toast } from "sonner";

export interface IncidentReportData {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  incident_date: string;
  incident_time?: string;
  incident_type: string;
  severity: string;
  status: string;
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
  damage_details?: string;
  created_at: string;
  updated_at: string;
  vehicle?: {
    make: string;
    model: string;
    year?: number;
    registration: string;
  };
  driver?: {
    name: string;
    license_number?: string;
  };
}

// Export single incident report as detailed PDF
export const exportIncidentReportToPDF = (incident: IncidentReportData) => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm", 
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Draw header
    drawIncidentReportHeader(doc, pageWidth, incident);

    // Draw incident details
    let currentY = drawIncidentBasicInfo(doc, incident, 45);
    currentY = drawIncidentClassification(doc, incident, currentY + 15);
    currentY = drawIncidentDescription(doc, incident, currentY + 15);
    currentY = drawIncidentParties(doc, incident, currentY + 15);
    currentY = drawIncidentFinancials(doc, incident, currentY + 15);
    currentY = drawIncidentFollowUp(doc, incident, currentY + 15);

    // Check if we need a new page
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    // Draw footer
    drawIncidentReportFooter(doc, pageWidth, pageHeight);

    const filename = `incident-report-${incident.id.slice(0, 8)}-${format(new Date(incident.incident_date), "yyyy-MM-dd")}`;
    doc.save(`${filename}.pdf`);
    toast.success("Incident report PDF exported successfully");
  } catch (error) {
    console.error("Error exporting incident report PDF:", error);
    toast.error("Failed to export incident report PDF");
  }
};

// Export multiple incident reports as summary table
export const exportIncidentReportsListToPDF = (incidents: IncidentReportData[]) => {
  if (!incidents || incidents.length === 0) {
    toast.error("No incident reports available to export");
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Draw header
    drawIncidentListHeader(doc, pageWidth);

    // Generate summary statistics
    drawIncidentSummaryStats(doc, incidents, 40);

    // Generate table
    generateIncidentReportsTable(doc, incidents, pageWidth, 75);

    // Draw footer
    drawIncidentReportFooter(doc, pageWidth, pageHeight);

    const filename = `incident-reports-summary-${format(new Date(), "yyyy-MM-dd")}`;
    doc.save(`${filename}.pdf`);
    toast.success("Incident reports summary PDF exported successfully");
  } catch (error) {
    console.error("Error exporting incident reports list PDF:", error);
    toast.error("Failed to export incident reports summary PDF");
  }
};

function drawIncidentReportHeader(doc: jsPDF, pageWidth: number, incident: IncidentReportData) {
  // Modern gradient-style header background
  doc.setFillColor(30, 64, 175); // Deep professional blue
  doc.rect(0, 0, pageWidth, 35, "F");

  // Subtle accent line at top
  doc.setFillColor(99, 102, 241); // Indigo accent
  doc.rect(0, 0, pageWidth, 2, "F");

  // Company logo area with clean white background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 8, 70, 20, 4, 4, "F");

  // Add the uploaded Koormatics logo
  try {
    doc.addImage(
      "/lovable-uploads/1e7ff00e-4144-4e6e-a20c-f8df7fd74542.png",
      "PNG",
      25,
      12,
      60,
      12
    );
  } catch (e) {
    console.error("Error adding logo to PDF:", e);
    // Fallback to text
    doc.setTextColor(30, 64, 175);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("KOORMATICS", 25, 18);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Transportation & Logistics", 25, 22);
  }

  // Main title with modern typography
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const title = "VEHICLE INCIDENT REPORT";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 20);

  // Professional subtitle with better spacing
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 220, 220);
  const subtitle = "SAFETY & FLEET MANAGEMENT DIVISION";
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 27);

  // Modern info panel on the right
  doc.setFillColor(255, 255, 255);
  doc.setFillColor(245, 247, 250); // Light background
  doc.roundedRect(pageWidth - 85, 8, 70, 20, 4, 4, "F");

  // Report metadata with modern styling  
  doc.setTextColor(75, 85, 99);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("REPORT ID", pageWidth - 80, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`#${incident.id.slice(0, 8).toUpperCase()}`, pageWidth - 80, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("GENERATED", pageWidth - 80, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(format(new Date(), "dd/MM/yyyy"), pageWidth - 80, 26);

  // Modern status badge with enhanced styling
  const statusColors = {
    reported: [239, 68, 68],    // Red-500
    investigating: [245, 158, 11], // Amber-500
    resolved: [34, 197, 94],    // Green-500
    closed: [107, 114, 128]     // Gray-500
  };
  const statusColor = statusColors[incident.status as keyof typeof statusColors] || [107, 114, 128];
  
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - 45, 12, 35, 10, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(incident.status.toUpperCase(), pageWidth - 27.5, 18.5, { align: "center" });
}

function drawIncidentListHeader(doc: jsPDF, pageWidth: number) {
  // Modern gradient-style header background
  doc.setFillColor(30, 64, 175); // Deep professional blue
  doc.rect(0, 0, pageWidth, 35, "F");

  // Subtle accent line at top
  doc.setFillColor(99, 102, 241); // Indigo accent
  doc.rect(0, 0, pageWidth, 2, "F");

  // Company logo area with clean white background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 8, 70, 20, 4, 4, "F");

  // Add the uploaded Koormatics logo
  try {
    doc.addImage(
      "/lovable-uploads/1e7ff00e-4144-4e6e-a20c-f8df7fd74542.png",
      "PNG",
      25,
      12,
      60,
      12
    );
  } catch (e) {
    console.error("Error adding logo to PDF:", e);
    // Fallback to text
    doc.setTextColor(30, 64, 175);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("KOORMATICS", 25, 18);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Transportation & Logistics", 25, 22);
  }

  // Main title with modern typography
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const title = "INCIDENT REPORTS SUMMARY";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 20);

  // Professional subtitle with better spacing
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 220, 220);
  const subtitle = "SAFETY & FLEET MANAGEMENT DIVISION";
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 27);

  // Modern info panel on the right
  doc.setFillColor(245, 247, 250); // Light background
  doc.roundedRect(pageWidth - 85, 8, 70, 20, 4, 4, "F");

  // Report metadata with modern styling  
  doc.setTextColor(75, 85, 99);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("GENERATED", pageWidth - 80, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(format(new Date(), "dd/MM/yyyy"), pageWidth - 80, 18);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("REPORT DATE", pageWidth - 80, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(format(new Date(), "EEEE"), pageWidth - 80, 26);
}

function drawIncidentBasicInfo(doc: jsPDF, incident: IncidentReportData, startY: number): number {
  const leftCol = 20;
  const rightCol = 110;
  let currentY = startY;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 54, 126); // Professional blue
  doc.text("INCIDENT INFORMATION", leftCol, currentY);
  currentY += 10;

  // Basic info boxes
  doc.setFillColor(248, 249, 250);
  doc.rect(leftCol, currentY, 85, 25, "F");
  doc.rect(rightCol, currentY, 85, 25, "F");

  // Left column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(33, 37, 41);
  doc.text("DATE & TIME", leftCol + 3, currentY + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const incidentDateTime = `${format(new Date(incident.incident_date), "dd MMM yyyy")}${incident.incident_time ? ` at ${incident.incident_time}` : ""}`;
  doc.text(incidentDateTime, leftCol + 3, currentY + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("LOCATION", leftCol + 3, currentY + 15);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const locationText = incident.location.length > 35 ? incident.location.substring(0, 35) + "..." : incident.location;
  doc.text(locationText, leftCol + 3, currentY + 20);

  // Right column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("VEHICLE", rightCol + 3, currentY + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const vehicleInfo = incident.vehicle 
    ? `${incident.vehicle.make} ${incident.vehicle.model} (${incident.vehicle.registration})`
    : "Vehicle information not available";
  doc.text(vehicleInfo, rightCol + 3, currentY + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DRIVER", rightCol + 3, currentY + 15);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const driverInfo = incident.driver 
    ? incident.driver.name
    : "No driver assigned";
  doc.text(driverInfo, rightCol + 3, currentY + 20);

  return currentY + 25;
}

function drawIncidentClassification(doc: jsPDF, incident: IncidentReportData, startY: number): number {
  const leftCol = 20;
  let currentY = startY;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 54, 126); // Professional blue
  doc.text("CLASSIFICATION", leftCol, currentY);
  currentY += 8;

  // Classification badges
  const badges = [
    { label: "TYPE", value: incident.incident_type, color: [52, 144, 220] },
    { label: "SEVERITY", value: incident.severity, color: getSeverityColor(incident.severity) },
  ];

  let xPos = leftCol;
  badges.forEach(badge => {
    // Badge background
    doc.setFillColor(badge.color[0], badge.color[1], badge.color[2]);
    doc.roundedRect(xPos, currentY, 40, 12, 2, 2, "F");
    
    // Badge text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(badge.label, xPos + 20, currentY + 4, { align: "center" });
    doc.setFontSize(10);
    doc.text(badge.value.toUpperCase(), xPos + 20, currentY + 9, { align: "center" });
    
    xPos += 50;
  });

  return currentY + 15;
}

function drawIncidentDescription(doc: jsPDF, incident: IncidentReportData, startY: number): number {
  const leftCol = 20;
  const rightCol = 195;
  let currentY = startY;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 54, 126); // Professional blue
  doc.text("DESCRIPTION", leftCol, currentY);
  currentY += 8;

  // Description box
  doc.setFillColor(248, 249, 250);
  doc.rect(leftCol, currentY, rightCol - leftCol, 30, "F");
  doc.setDrawColor(220, 220, 220);
  doc.rect(leftCol, currentY, rightCol - leftCol, 30, "S");

  // Description text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(33, 37, 41);
  
  const splitDescription = doc.splitTextToSize(incident.description, rightCol - leftCol - 6);
  doc.text(splitDescription, leftCol + 3, currentY + 8);

  return currentY + 35;
}

function drawIncidentParties(doc: jsPDF, incident: IncidentReportData, startY: number): number {
  const leftCol = 20;
  let currentY = startY;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 54, 126); // Professional blue
  doc.text("PARTIES INVOLVED", leftCol, currentY);
  currentY += 8;

  // Flags
  const flags = [
    { label: "Injuries Reported", value: incident.injuries_reported, color: incident.injuries_reported ? [220, 53, 69] : [108, 117, 125] },
    { label: "Third Party Involved", value: incident.third_party_involved, color: incident.third_party_involved ? [255, 193, 7] : [108, 117, 125] },
    { label: "Photos Attached", value: incident.photos_attached, color: incident.photos_attached ? [40, 167, 69] : [108, 117, 125] },
  ];

  flags.forEach((flag, index) => {
    const xPos = leftCol + (index * 60);
    
    // Flag indicator
    doc.setFillColor(flag.color[0], flag.color[1], flag.color[2]);
    doc.circle(xPos + 3, currentY + 3, 2, "F");
    
    // Flag text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(33, 37, 41);
    doc.text(flag.label, xPos + 8, currentY + 4);
    doc.setFont("helvetica", "bold");
    doc.text(flag.value ? "YES" : "NO", xPos + 8, currentY + 8);
  });

  return currentY + 15;
}

function drawIncidentFinancials(doc: jsPDF, incident: IncidentReportData, startY: number): number {
  const leftCol = 20;
  const rightCol = 110;
  let currentY = startY;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 54, 126); // Professional blue
  doc.text("FINANCIAL IMPACT", leftCol, currentY);
  currentY += 10;

  // Financial boxes
  doc.setFillColor(248, 249, 250);
  doc.rect(leftCol, currentY, 85, 20, "F");
  doc.rect(rightCol, currentY, 85, 20, "F");

  // Left: Estimated cost
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(33, 37, 41);
  doc.text("ESTIMATED DAMAGE COST", leftCol + 3, currentY + 5);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(220, 53, 69);
  const estimatedCost = incident.estimated_damage_cost ? `$${incident.estimated_damage_cost.toFixed(2)}` : "Not assessed";
  doc.text(estimatedCost, leftCol + 3, currentY + 15);

  // Right: Actual cost
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(33, 37, 41);
  doc.text("ACTUAL REPAIR COST", rightCol + 3, currentY + 5);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(incident.actual_repair_cost ? 40 : 108, incident.actual_repair_cost ? 167 : 117, incident.actual_repair_cost ? 69 : 125);
  const actualCost = incident.actual_repair_cost ? `$${incident.actual_repair_cost.toFixed(2)}` : "Pending";
  doc.text(actualCost, rightCol + 3, currentY + 15);

  return currentY + 25;
}

function drawIncidentFollowUp(doc: jsPDF, incident: IncidentReportData, startY: number): number {
  const leftCol = 20;
  let currentY = startY;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 54, 126); // Professional blue
  doc.text("FOLLOW-UP & REFERENCES", leftCol, currentY);
  currentY += 10;

  // Info grid
  const infoItems = [
    { label: "Reported By", value: incident.reported_by },
    { label: "Police Report #", value: incident.police_report_number || "Not applicable" },
    { label: "Insurance Claim #", value: incident.insurance_claim_number || "Not filed" },
    { label: "Follow-up Required", value: incident.follow_up_required ? "YES" : "NO" },
    { label: "Follow-up Date", value: incident.follow_up_date ? format(new Date(incident.follow_up_date), "dd MMM yyyy") : "Not scheduled" },
    { label: "Report Created", value: format(new Date(incident.created_at), "dd MMM yyyy") },
  ];

  let xPos = leftCol;
  let yPos = currentY;
  
  infoItems.forEach((item, index) => {
    if (index % 2 === 0 && index > 0) {
      yPos += 12;
      xPos = leftCol;
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(108, 117, 125);
    doc.text(item.label.toUpperCase(), xPos, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(33, 37, 41);
    doc.text(item.value, xPos, yPos + 5);
    
    xPos += 95;
  });

  return yPos + 15;
}

function drawIncidentSummaryStats(doc: jsPDF, incidents: IncidentReportData[], startY: number) {
  const stats = {
    total: incidents.length,
    severe: incidents.filter(i => i.severity === "severe" || i.severity === "critical").length,
    pending: incidents.filter(i => i.status === "reported" || i.status === "investigating").length,
    totalCost: incidents.reduce((sum, i) => sum + (i.estimated_damage_cost || 0), 0),
  };

  const leftCol = 20;
  let currentY = startY;

  // Stats boxes
  const statBoxes = [
    { label: "Total Reports", value: stats.total.toString(), color: [52, 144, 220] },
    { label: "Severe Incidents", value: stats.severe.toString(), color: [220, 53, 69] },
    { label: "Pending Cases", value: stats.pending.toString(), color: [255, 193, 7] },
    { label: "Total Est. Cost", value: `$${stats.totalCost.toFixed(2)}`, color: [40, 167, 69] },
  ];

  statBoxes.forEach((stat, index) => {
    const xPos = leftCol + (index * 65);
    
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(xPos, currentY, 60, 20, 3, 3, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(stat.value, xPos + 30, currentY + 8, { align: "center" });
    
    doc.setFontSize(8);
    doc.text(stat.label, xPos + 30, currentY + 15, { align: "center" });
  });
}

function generateIncidentReportsTable(doc: jsPDF, incidents: IncidentReportData[], pageWidth: number, startY: number) {
  const tableData = incidents.map(incident => [
    format(new Date(incident.incident_date), "dd MMM yyyy"),
    incident.vehicle ? `${incident.vehicle.make} ${incident.vehicle.model}` : "N/A",
    incident.incident_type.toUpperCase(),
    incident.severity.toUpperCase(),
    incident.status.toUpperCase(),
    incident.location.length > 30 ? incident.location.substring(0, 30) + "..." : incident.location,
    incident.estimated_damage_cost ? `$${incident.estimated_damage_cost.toFixed(2)}` : "N/A",
    incident.reported_by,
  ]);

  const headers = [
    "DATE",
    "VEHICLE", 
    "TYPE",
    "SEVERITY",
    "STATUS",
    "LOCATION",
    "EST. COST",
    "REPORTED BY"
  ];

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: startY,
    margin: { left: 15, right: 15 },
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
      fillColor: [25, 54, 126], // Professional blue
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 25, halign: "center" },
      1: { cellWidth: 35, halign: "left" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 25, halign: "center" },
      5: { cellWidth: 50, halign: "left" },
      6: { cellWidth: 25, halign: "right" },
      7: { cellWidth: 35, halign: "left" },
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
  });
}

function drawIncidentReportFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const footerY = pageHeight - 20;

  // Footer background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, footerY - 5, pageWidth, 25, "F");

  // Company info
  doc.setTextColor(25, 54, 126); // Professional blue
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KOORMATICS", 20, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Safety & Fleet Management Division", 20, footerY + 4);

  // Page number
  doc.setTextColor(60, 60, 60);
  const pageInfo = `Page ${doc.internal.getNumberOfPages()}`;
  const pageInfoWidth = doc.getTextWidth(pageInfo);
  doc.text(pageInfo, (pageWidth - pageInfoWidth) / 2, footerY + 2);

  // Confidentiality notice
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text("CONFIDENTIAL INCIDENT REPORT", pageWidth - 20, footerY, { align: "right" });
  doc.text(`Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 20, footerY + 4, { align: "right" });
}

function getSeverityColor(severity: string): [number, number, number] {
  const colors = {
    minor: [40, 167, 69],      // Green
    moderate: [255, 193, 7],   // Yellow
    severe: [255, 108, 55],    // Orange
    critical: [220, 53, 69],   // Red
  };
  return (colors[severity as keyof typeof colors] || [108, 117, 125]) as [number, number, number];
}

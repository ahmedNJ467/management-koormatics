
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { format } from "date-fns";
import { toast } from "sonner";

// Professional PDF export with modern design and excellent visual appeal
export const exportToPDF = (data: any[], title: string, filename: string) => {
  if (!data || data.length === 0) {
    toast.error("No data available to export to PDF");
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

    // Draw professional header with modern design
    drawProfessionalHeader(doc, pageWidth, title, filename);

    // Generate table based on report type with enhanced styling
    if (filename === "trips-report") {
      generateProfessionalTripsTable(doc, data, pageWidth);
    } else if (filename === "vehicles-report") {
      generateProfessionalVehiclesTable(doc, data, pageWidth);
    } else {
      generateProfessionalGenericTable(doc, data, filename, pageWidth);
    }

    // Draw professional footer
    drawProfessionalFooter(doc, pageWidth, pageHeight);

    doc.save(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Professional PDF exported successfully");
  } catch (error) {
    console.error("Error exporting PDF:", error);
    toast.error("Failed to export PDF. Please try again later.");
  }
};

// Professional header with modern corporate design
function drawProfessionalHeader(
  doc: jsPDF,
  pageWidth: number,
  title: string,
  filename: string
) {
  // Gradient-like header background with professional blue
  doc.setFillColor(25, 54, 126); // Deep professional blue
  doc.rect(0, 0, pageWidth, 25, "F");

  // Accent stripe at top
  doc.setFillColor(52, 144, 220); // Bright blue accent
  doc.rect(0, 0, pageWidth, 3, "F");

  // Company logo area with background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 5, 50, 15, 2, 2, "F");

  // Company name in logo area
  doc.setTextColor(25, 54, 126);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("KOORMATICS", 18, 11);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Transportation & Logistics", 18, 15);

  // Main title - center aligned
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const mainTitle = title.toUpperCase();
  const titleWidth = doc.getTextWidth(mainTitle);
  doc.text(mainTitle, (pageWidth - titleWidth) / 2, 15);

  // Professional subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const subtitle = "MOVEMENT CONTROL DEPARTMENT";
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 20);

  // Date and time stamp
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  const timestamp = `Generated: ${format(
    new Date(),
    "EEEE, MMMM do, yyyy 'at' HH:mm"
  )}`;
  doc.text(timestamp, pageWidth - 15, 12, { align: "right" });

  // Document reference
  const docRef = `DOC-${filename.toUpperCase()}-${format(
    new Date(),
    "yyyyMMdd"
  )}`;
  doc.text(docRef, pageWidth - 15, 17, { align: "right" });
}

// Professional trips table with enhanced visual design
function generateProfessionalTripsTable(
  doc: jsPDF,
  data: any[],
  pageWidth: number
) {
  // Sort trips by date (descending), then by time
  const sortedData = [...data].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    if (dateA !== dateB) return dateB - dateA;
    // If same date, sort by time
    const timeA = a.time ? a.time : "00:00";
    const timeB = b.time ? b.time : "00:00";
    return timeB.localeCompare(timeA);
  });

  const tableData = sortedData.map((trip) => {
    const tripDate = trip.date
      ? format(new Date(trip.date), "dd MMM yyyy")
      : "";
    const clientName = trip.clients?.name || trip.client || "";
    const passengers =
      trip.passengers && trip.passengers.length > 0
        ? trip.passengers.slice(0, 4).join(", ") +
          (trip.passengers.length > 4
            ? ` +${trip.passengers.length - 4} more`
            : "")
        : "";
    // Service type: try all possible fields
    let serviceType = trip.service_type || trip.display_type || trip.type || "";
    serviceType = serviceType.replace(/_/g, " ").toUpperCase();
    const pickupAddress = trip.pickup_location || trip.pickup || "";
    const dropoffAddress = trip.dropoff_location || trip.dropoff || "";
    const timeStr = trip.time
      ? format(new Date(`2000-01-01T${trip.time}`), "HH:mm")
      : "";
    const carrierFlight = trip.flight_number
      ? `${trip.airline || "AIRLINE"} ${trip.flight_number}`
      : "";
    const vehicleInfo = trip.vehicles
      ? `${trip.vehicles.make || ""} ${trip.vehicles.model || ""}`.trim() ||
        "UNASSIGNED"
      : trip.vehicle || "UNASSIGNED";
    const driverInfo = trip.drivers?.name || trip.driver || "UNASSIGNED";
    return [
      tripDate,
      clientName,
      passengers,
      serviceType,
      pickupAddress,
      dropoffAddress,
      timeStr,
      carrierFlight,
      vehicleInfo,
      driverInfo,
    ];
  });

  const headers = [
    "DATE",
    "CLIENT",
    "PASSENGERS",
    "SERVICE TYPE",
    "PICKUP LOCATION",
    "DROPOFF LOCATION",
    "TIME",
    "FLIGHT INFO",
    "VEHICLE",
    "DRIVER",
  ];

  // Margins and table width
  const tableMargin = 15; // 15mm margin for full-width professional look
  const tableWidth = pageWidth - tableMargin * 2;
  const startX = tableMargin;
  // Optimized column widths (sum = 247mm)
  const colWidths = [
    20, // DATE
    28, // CLIENT
    40, // PASSENGERS
    28, // SERVICE TYPE
    28, // PICKUP LOCATION
    28, // DROPOFF LOCATION
    15, // TIME
    22, // FLIGHT INFO
    20, // VEHICLE
    18, // DRIVER
  ];

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 35,
    margin: { left: startX, right: startX },
    styles: {
      fontSize: 8,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      lineColor: [180, 190, 210],
      lineWidth: 0.25,
      textColor: [40, 40, 40],
      font: "helvetica",
      valign: "middle",
      minCellHeight: 10,
    },
    headStyles: {
      fillColor: [25, 54, 126],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 9,
      cellPadding: { top: 6, right: 3, bottom: 6, left: 3 },
      lineColor: [25, 54, 126],
      lineWidth: 0,
    },
    columnStyles: {
      0: {
        cellWidth: colWidths[0],
        halign: "center",
        fontStyle: "bold",
        overflow: "ellipsize",
      }, // DATE
      1: { cellWidth: colWidths[1], halign: "left", overflow: "ellipsize" }, // CLIENT
      2: { cellWidth: colWidths[2], halign: "left", overflow: "linebreak" }, // PASSENGERS
      3: {
        cellWidth: colWidths[3],
        halign: "center",
        fontStyle: "bold",
        overflow: "ellipsize",
      }, // SERVICE TYPE
      4: { cellWidth: colWidths[4], halign: "left", overflow: "linebreak" }, // PICKUP
      5: { cellWidth: colWidths[5], halign: "left", overflow: "linebreak" }, // DROPOFF
      6: {
        cellWidth: colWidths[6],
        halign: "center",
        fontStyle: "bold",
        overflow: "ellipsize",
      }, // TIME
      7: { cellWidth: colWidths[7], halign: "center", overflow: "ellipsize" }, // FLIGHT INFO
      8: { cellWidth: colWidths[8], halign: "center", overflow: "ellipsize" }, // VEHICLE
      9: { cellWidth: colWidths[9], halign: "center", overflow: "ellipsize" }, // DRIVER
    },
    alternateRowStyles: {
      fillColor: [245, 247, 252], // Subtle blue-gray
    },
    tableLineColor: [180, 190, 210],
    tableLineWidth: 0.25,
    didDrawCell: (data) => {
      // Service type color coding
      if (data.section === "body" && data.column.index === 3) {
        const cellText = data.cell.text.join("").toLowerCase();
        let bgColor = null;
        let textColor = null;
        if (cellText.includes("airport") || cellText.includes("dropoff")) {
          bgColor = [255, 235, 238];
          textColor = [183, 28, 28];
        } else if (cellText.includes("round") || cellText.includes("trip")) {
          bgColor = [255, 248, 225];
          textColor = [146, 64, 14];
        } else if (cellText.includes("pickup")) {
          bgColor = [236, 253, 245];
          textColor = [5, 150, 105];
        }
        if (bgColor) {
          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            "F"
          );
          if (textColor) {
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFont("helvetica", "bold");
          }
        }
      }
    },
    didDrawPage: (data) => {
      // Add subtle border around table
      const tableY = 35;
      const tableHeight = (data as any).cursor.y - tableY;
      doc.setDrawColor(180, 190, 210);
      doc.setLineWidth(0.5);
      doc.rect(startX, tableY, tableWidth, tableHeight, "S");
    },
  });
}

// Professional vehicles table
function generateProfessionalVehiclesTable(
  doc: jsPDF,
  data: any[],
  pageWidth: number
) {
  // Calculate summary statistics
  const totalVehicles = data.length;
  const activeVehicles = data.filter(
    (v) =>
      v.status?.toLowerCase().includes("active") ||
      v.status?.toLowerCase().includes("available")
  ).length;
  const maintenanceVehicles = data.filter(
    (v) =>
      v.status?.toLowerCase().includes("maintenance") ||
      v.status?.toLowerCase().includes("repair")
  ).length;
  const inactiveVehicles = data.filter(
    (v) =>
      v.status?.toLowerCase().includes("inactive") ||
      v.status?.toLowerCase().includes("unavailable")
  ).length;

  // Calculate total maintenance costs
  const totalMaintenanceCost = data.reduce((sum, vehicle) => {
    if (vehicle.maintenance && Array.isArray(vehicle.maintenance)) {
      return (
        sum +
        vehicle.maintenance.reduce(
          (itemSum, item) => itemSum + Number(item.cost || 0),
          0
        )
      );
    }
    return sum;
  }, 0);

  // Calculate average maintenance cost per vehicle
  const avgMaintenanceCost =
    totalVehicles > 0 ? totalMaintenanceCost / totalVehicles : 0;

  // Add summary section
  const summaryY = 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 54, 126);
  doc.text("VEHICLE FLEET SUMMARY", pageWidth / 2, summaryY, {
    align: "center",
  });

  // Draw summary box
  const summaryBoxY = summaryY + 5;
  const summaryBoxHeight = 25;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, summaryBoxY, pageWidth - 30, summaryBoxHeight, 2, 2, "S");

  // Add summary content
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  // Left column
  doc.setFont("helvetica", "bold");
  doc.text("Total Vehicles:", 25, summaryBoxY + 8);
  doc.text("Active Vehicles:", 25, summaryBoxY + 15);
  doc.text("In Maintenance:", 25, summaryBoxY + 22);

  doc.setFont("helvetica", "normal");
  doc.text(totalVehicles.toString(), 80, summaryBoxY + 8);
  doc.text(activeVehicles.toString(), 80, summaryBoxY + 15);
  doc.text(maintenanceVehicles.toString(), 80, summaryBoxY + 22);

  // Right column
  doc.setFont("helvetica", "bold");
  doc.text("Inactive Vehicles:", pageWidth - 100, summaryBoxY + 8);
  doc.text("Total Maintenance Cost:", pageWidth - 100, summaryBoxY + 15);
  doc.text("Avg. Cost per Vehicle:", pageWidth - 100, summaryBoxY + 22);

  doc.setFont("helvetica", "normal");
  doc.text(inactiveVehicles.toString(), pageWidth - 25, summaryBoxY + 8, {
    align: "right",
  });
  doc.text(
    `$${totalMaintenanceCost.toFixed(2)}`,
    pageWidth - 25,
    summaryBoxY + 15,
    { align: "right" }
  );
  doc.text(
    `$${avgMaintenanceCost.toFixed(2)}`,
    pageWidth - 25,
    summaryBoxY + 22,
    { align: "right" }
  );

  // Add a subtle divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(
    15,
    summaryBoxY + summaryBoxHeight + 5,
    pageWidth - 15,
    summaryBoxY + summaryBoxHeight + 5
  );

  // Prepare table data
  const tableData = data.map((vehicle) => {
    // Calculate maintenance costs
    const maintenanceCost =
      vehicle.maintenance && Array.isArray(vehicle.maintenance)
        ? vehicle.maintenance.reduce(
            (sum: number, item: any) => sum + Number(item.cost || 0),
            0
          )
        : 0;

    // Get last maintenance date
    let lastMaintenanceDate = "N/A";
    if (
      vehicle.maintenance &&
      Array.isArray(vehicle.maintenance) &&
      vehicle.maintenance.length > 0
    ) {
      const sortedMaintenance = [...vehicle.maintenance].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

      if (sortedMaintenance[0].date) {
        lastMaintenanceDate = format(
          new Date(sortedMaintenance[0].date),
          "dd MMM yyyy"
        );
      }
    }

    return [
      `${vehicle.make || ""} ${vehicle.model || ""} (${
        vehicle.year || ""
      })`.trim(),
      vehicle.status || "UNKNOWN",
      vehicle.type || "N/A",
      vehicle.registration || "N/A",
      lastMaintenanceDate,
      `$${maintenanceCost.toFixed(2)}`,
    ];
  });

  const headers = [
    "VEHICLE",
    "STATUS",
    "TYPE",
    "REGISTRATION",
    "LAST MAINTENANCE",
    "MAINTENANCE COST",
  ];

  // Calculate table width and center it
  const tableWidth = pageWidth - 30; // 15mm margin on each side
  const startX = (pageWidth - tableWidth) / 2;

  // Add table title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 54, 126);
  doc.text(
    "VEHICLE DETAILS",
    pageWidth / 2,
    summaryBoxY + summaryBoxHeight + 15,
    { align: "center" }
  );

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: summaryBoxY + summaryBoxHeight + 20,
    margin: { left: startX, right: startX },
    styles: {
      fontSize: 9,
      cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      textColor: [40, 40, 40],
      font: "helvetica",
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [25, 54, 126],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 10,
      minCellHeight: 12,
    },
    columnStyles: {
      0: { cellWidth: 50, halign: "left", fontStyle: "bold" }, // VEHICLE
      1: { cellWidth: 25, halign: "center" }, // STATUS
      2: { cellWidth: 25, halign: "center" }, // TYPE
      3: { cellWidth: 30, halign: "center" }, // REGISTRATION
      4: { cellWidth: 30, halign: "center" }, // LAST MAINTENANCE
      5: { cellWidth: 30, halign: "right", fontStyle: "bold" }, // MAINTENANCE COST
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Very light blue-gray
    },
    didDrawCell: (data) => {
      // Professional color coding for status
      if (data.section === "body" && data.column.index === 1) {
        const cellText = data.cell.text.join("").toLowerCase();
        let bgColor = null;
        let textColor = null;

        if (cellText.includes("active") || cellText.includes("available")) {
          bgColor = [236, 253, 245]; // Light green
          textColor = [5, 150, 105];
        } else if (
          cellText.includes("maintenance") ||
          cellText.includes("repair")
        ) {
          bgColor = [255, 235, 238]; // Light red
          textColor = [183, 28, 28];
        } else if (
          cellText.includes("inactive") ||
          cellText.includes("unavailable")
        ) {
          bgColor = [255, 248, 225]; // Light amber
          textColor = [146, 64, 14];
        }

        if (bgColor) {
          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            "F"
          );

          if (textColor) {
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFont("helvetica", "bold");
          }
        }
      }

      // Highlight maintenance costs
      if (data.section === "body" && data.column.index === 5) {
        const cost = parseFloat(data.cell.text.join("").replace("$", ""));
        if (cost > avgMaintenanceCost * 1.5) {
          doc.setTextColor(183, 28, 28); // Red for high costs
          doc.setFont("helvetica", "bold");
        } else if (cost > avgMaintenanceCost) {
          doc.setTextColor(146, 64, 14); // Amber for above average costs
          doc.setFont("helvetica", "bold");
        }
      }
    },
    didDrawPage: (data) => {
      // Add subtle border around table
      const tableY = summaryBoxY + summaryBoxHeight + 20;
      const tableHeight = (data as any).cursor.y - tableY;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(startX, tableY, tableWidth, tableHeight, "S");

      // Add page number
      const pageNumber = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(pageNumber, pageWidth / 2, (data as any).cursor.y + 10, {
        align: "center",
      });
    },
  });
}

// Professional generic table
function generateProfessionalGenericTable(
  doc: jsPDF,
  data: any[],
  filename: string,
  pageWidth: number
) {
  const tableData = data.map((item) =>
    Object.values(item).map((val) => String(val || ""))
  );
  const headers =
    data.length > 0
      ? Object.keys(data[0]).map((key) => key.replace(/_/g, " ").toUpperCase())
      : [];

  // Calculate table width and center it
  const tableWidth = pageWidth - 30; // 15mm margin on each side
  const startX = (pageWidth - tableWidth) / 2;

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 30,
    margin: { left: startX, right: startX },
    styles: {
      fontSize: 8,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      textColor: [40, 40, 40],
      font: "helvetica",
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [25, 54, 126],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 10,
      minCellHeight: 12,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // Add subtle border around table
      const tableY = 30;
      const tableHeight = (data as any).cursor.y - tableY;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(startX, tableY, tableWidth, tableHeight, "S");
    },
  });
}

// Professional footer with enhanced design
function drawProfessionalFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number
) {
  const footerY = pageHeight - 20;

  // Footer background with gradient effect
  doc.setFillColor(248, 250, 252);
  doc.rect(0, footerY - 5, pageWidth, 25, "F");

  // Top border line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

  // Company information - left side
  doc.setTextColor(25, 54, 126);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KOORMATICS", 20, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Transportation & Logistics Management", 20, footerY + 4);
  doc.text("www.koormatics.com | info@koormatics.com", 20, footerY + 8);

  // Page information - center
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const pageInfo = `Page ${doc.internal.getNumberOfPages()}`;
  const pageInfoWidth = doc.getTextWidth(pageInfo);
  doc.text(pageInfo, (pageWidth - pageInfoWidth) / 2, footerY + 2);

  // Generation info - right side
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  const genTime = format(new Date(), "dd/MM/yyyy HH:mm");
  doc.text(`Generated: ${genTime}`, pageWidth - 20, footerY, {
    align: "right",
  });
  doc.text("Confidential Document", pageWidth - 20, footerY + 4, {
    align: "right",
  });

  // Professional accent line at bottom
  doc.setDrawColor(52, 144, 220);
  doc.setLineWidth(2);
  doc.line(0, pageHeight - 2, pageWidth, pageHeight - 2);
}

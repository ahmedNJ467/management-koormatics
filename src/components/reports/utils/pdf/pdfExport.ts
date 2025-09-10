import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { format } from "date-fns";
import { toast } from "sonner";

// Cache logo between pages/exports to avoid re-loading
let CACHED_LOGO_DATA_URL: string | null = null;

async function loadLogoDataUrl(): Promise<string | null> {
  if (CACHED_LOGO_DATA_URL) return CACHED_LOGO_DATA_URL;
  const logoUrl = "/images/Koormatics-logo.png";
  const logoWidth = 48; // render width (mm)
  const logoHeight = 14; // render height (mm)
  try {
    const pngDataUrl: string = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetScale = 4; // high clarity
        canvas.width = Math.max(1, Math.floor(logoWidth * targetScale));
        canvas.height = Math.max(1, Math.floor(logoHeight * targetScale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas 2D context unavailable"));
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png", 1.0));
      };
      img.onerror = (err) => reject(err);
      img.src = logoUrl;
    });
    CACHED_LOGO_DATA_URL = pngDataUrl;
    return pngDataUrl;
  } catch (e) {
    console.error("Logo image failed to load:", e);
    return null;
  }
}

function drawHeaderFooter(
  doc: jsPDF,
  title: string,
  logoDataUrl: string | null
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header (white with thin top blue line and subtle bottom divider)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 2, "F");

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 10, 5, 48, 14);
    } catch {}
  } else {
    doc.setTextColor(59, 130, 246);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("KOORMATICS", 10, 14);
  }

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  const dateText = format(new Date(), "MMM dd, yyyy 'at' HH:mm");
  doc.text(dateText, pageWidth - 10, 14, { align: "right" });

  // subtle divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(10, 22, pageWidth - 10, 22);

  // Footer (blue bar with green accent)
  const barHeight = 16;
  const barTop = pageHeight - barHeight;
  doc.setFillColor(34, 197, 94); // Green accent
  doc.rect(0, barTop - 2, pageWidth, 2, "F");
  doc.setFillColor(59, 130, 246); // Blue bar
  doc.rect(0, barTop, pageWidth, barHeight, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Koormatics - Transportation & Logistics", 10, barTop + 11);
  const currentPage = (doc as any).internal.getCurrentPageInfo
    ? (doc as any).internal.getCurrentPageInfo().pageNumber
    : 1;
  const totalPages = (doc as any).internal.getNumberOfPages();
  doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth / 2, barTop + 11, {
    align: "center",
  });
  doc.text(
    format(new Date(), "dd/MM/yyyy HH:mm"),
    pageWidth - 10,
    barTop + 11,
    {
      align: "right",
    }
  );
}

// Simple and clean PDF export with minimalist design
export const exportToPDF = async (
  data: any[],
  title: string,
  filename: string
) => {
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

    // High-quality logo (cached) and unified header/footer drawing
    const logoDataUrl = await loadLogoDataUrl();
    drawHeaderFooter(doc, title, logoDataUrl);

    // Generate table based on report type
    if (filename === "trips-report") {
      generateTripsTable(doc, data, pageWidth);
    } else if (filename === "vehicles-report") {
      generateVehiclesTable(doc, data, pageWidth);
    } else if (filename === "maintenance-report") {
      generateMaintenanceTable(doc, data, pageWidth);
    } else if (filename === "fuel-report") {
      generateFuelTable(doc, data, pageWidth);
    } else if (filename === "drivers-report") {
      generateDriversTable(doc, data, pageWidth);
    } else if (filename === "financial-report") {
      generateFinancialTable(doc, data, pageWidth);
    } else {
      generateGenericTable(doc, data, filename, pageWidth);
    }

    // Add header/footer on every page (multi-page tables)
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      (doc as any).setPage(i);
      drawHeaderFooter(doc, title, logoDataUrl);
    }

    doc.save(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF exported successfully");
  } catch (error) {
    console.error("Error exporting PDF:", error);
    toast.error("Failed to export PDF. Please try again later.");
  }
};

// Simple header with logo (fully white header)
async function drawSimpleHeader(doc: jsPDF, pageWidth: number, title: string) {
  // White header background to match brand colors
  doc.setFillColor(255, 255, 255); // White background
  doc.rect(0, 0, pageWidth, 20, "F");

  // Load and add Koormatics logo
  const logoUrl = "/images/Koormatics-logo.png";
  const logoWidth = 40;
  const logoHeight = 12;

  try {
    const pngDataUrl: string = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetScale = 3;
        canvas.width = Math.max(1, Math.floor(logoWidth * targetScale));
        canvas.height = Math.max(1, Math.floor(logoHeight * targetScale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas 2D context unavailable"));

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png", 1.0));
      };
      img.onerror = (err) => {
        console.error("Logo image failed to load:", err);
        reject(err);
      };
      img.src = logoUrl;
    });

    // Add the logo image
    doc.addImage(pngDataUrl, "PNG", 10, 4, logoWidth, logoHeight);
  } catch (e) {
    console.error("Error adding logo:", e);
    // Fallback to text logo
    doc.setTextColor(59, 130, 246); // Blue text on white background
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("KOORMATICS", 10, 12);
  }

  // Report title (neutral/dark for professionalism on white)
  doc.setTextColor(17, 24, 39); // Slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 12);

  // Generation date (muted gray on white header)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128); // Gray-500
  const dateText = format(new Date(), "MMM dd, yyyy 'at' HH:mm");
  doc.text(dateText, pageWidth - 10, 12, { align: "right" });
}

// Simple footer with solid blue bar and white text
function drawSimpleFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const barHeight = 16;
  const barTop = pageHeight - barHeight;

  // Blue footer bar
  doc.setFillColor(59, 130, 246); // Blue-500
  doc.rect(0, barTop, pageWidth, barHeight, "F");

  // Footer text (white)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Koormatics - Transportation & Logistics", 10, barTop + 11);

  const pageNum = doc.internal.getNumberOfPages();
  doc.text(`Page ${pageNum}`, pageWidth / 2, barTop + 11, { align: "center" });

  doc.text(
    format(new Date(), "dd/MM/yyyy HH:mm"),
    pageWidth - 10,
    barTop + 11,
    {
      align: "right",
    }
  );
}

// Trips table
function generateTripsTable(doc: jsPDF, data: any[], pageWidth: number) {
  const tableData = data.map((trip) => {
    // Format passengers in single line with commas
    let passengersDisplay = "N/A";
    if (trip.passengers && trip.passengers.length > 0) {
      passengersDisplay = trip.passengers.join(", ");
    }

    // Format stops for display
    let stopsDisplay = "N/A";
    if (trip.stops && trip.stops.length > 0) {
      if (trip.stops.length === 1) {
        stopsDisplay = trip.stops[0];
      } else {
        // Create vertical list with bullet points
        stopsDisplay = trip.stops.map((stop: string) => `• ${stop}`).join("\n");
      }
    }

    // Format time to AM/PM format
    let timeDisplay = "N/A";
    if (trip.time) {
      try {
        const time = new Date(`2000-01-01T${trip.time}`);
        timeDisplay = time.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } catch (e) {
        timeDisplay = trip.time;
      }
    }

    // Format service type to display "Airport Pickup" instead of "airport_pickup"
    let serviceTypeDisplay = "N/A";
    if (trip.display_type || trip.service_type) {
      const serviceType = trip.display_type || trip.service_type;
      if (serviceType === "airport_pickup") {
        serviceTypeDisplay = "Airport Pickup";
      } else if (serviceType === "airport_dropoff") {
        serviceTypeDisplay = "Airport Dropoff";
      } else if (serviceType === "round_trip") {
        serviceTypeDisplay = "Round Trip";
      } else if (serviceType === "one_way") {
        serviceTypeDisplay = "One Way Transfer";
      } else if (serviceType === "full_day_hire") {
        serviceTypeDisplay = "Full Day Hire";
      } else if (serviceType === "half_day") {
        serviceTypeDisplay = "Half Day";
      } else {
        serviceTypeDisplay = serviceType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
      }
    }

    // Format flight info from airline and flight_number
    let flightInfoDisplay = "N/A";
    if (trip.airline || trip.flight_number) {
      const parts = [];
      if (trip.airline) parts.push(trip.airline);
      if (trip.flight_number) parts.push(trip.flight_number);
      if (trip.terminal) parts.push(`Terminal ${trip.terminal}`);
      flightInfoDisplay = parts.join(" ");
    }

    return [
      format(new Date(trip.date), "MMM dd, yyyy"),
      trip.clients?.name || "N/A",
      passengersDisplay,
      serviceTypeDisplay,
      trip.pickup_location || "N/A",
      trip.dropoff_location || "N/A",
      stopsDisplay,
      timeDisplay,
      flightInfoDisplay,
      trip.vehicles ? `${trip.vehicles.make} ${trip.vehicles.model}` : "N/A",
      trip.drivers?.name || "N/A",
      trip.status || "N/A",
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "Date",
        "Client",
        "Passengers",
        "Service Type",
        "Pickup Location",
        "Dropoff Location",
        "Stops",
        "Scheduled Time",
        "Flight Info",
        "Vehicle",
        "Driver",
        "Status",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue header
      textColor: [255, 255, 255], // White text
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5,
    },
    columnStyles: {
      2: {
        // Passengers column - now single line
        cellWidth: 30,
        halign: "left",
        valign: "middle",
        fontSize: 7,
        lineColor: [200, 200, 200],
      },
      6: {
        // Stops column
        cellWidth: 25,
        halign: "left",
        valign: "top",
        fontSize: 6.5,
        lineColor: [200, 200, 200],
      },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 10, right: 10 },
    tableWidth: pageWidth - 20,
  });
}

// Vehicles table
function generateVehiclesTable(doc: jsPDF, data: any[], pageWidth: number) {
  const tableData = data.map((vehicle) => [
    vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : "N/A",
    vehicle.status || "N/A",
    vehicle.type || "N/A",
    vehicle.registration || "N/A",
    vehicle.year || "N/A",
    vehicle.fuel_type || "N/A",
    vehicle.mileage ? `${vehicle.mileage} km` : "N/A",
  ]);

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "Vehicle",
        "Status",
        "Type",
        "Registration",
        "Year",
        "Fuel Type",
        "Mileage",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue header
      textColor: [255, 255, 255], // White text
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 10, right: 10 },
    tableWidth: pageWidth - 20,
  });
}

// Maintenance table
function generateMaintenanceTable(doc: jsPDF, data: any[], pageWidth: number) {
  const tableData = data.map((maintenance) => [
    format(new Date(maintenance.date), "MMM dd, yyyy"),
    maintenance.vehicles
      ? `${maintenance.vehicles.make} ${maintenance.vehicles.model}`
      : "N/A",
    maintenance.type || "N/A",
    maintenance.description || "N/A",
    maintenance.cost ? `$${Number(maintenance.cost).toFixed(2)}` : "$0.00",
    maintenance.status || "N/A",
  ]);

  autoTable(doc, {
    startY: 30,
    head: [["Date", "Vehicle", "Type", "Description", "Cost", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue header
      textColor: [255, 255, 255], // White text
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 10, right: 10 },
    tableWidth: pageWidth - 20,
  });
}

// Fuel table
function generateFuelTable(doc: jsPDF, data: any[], pageWidth: number) {
  const tableData = data.map((fuel) => [
    format(new Date(fuel.date), "MMM dd, yyyy"),
    fuel.vehicles ? `${fuel.vehicles.make} ${fuel.vehicles.model}` : "N/A",
    fuel.fuel_type || "N/A",
    fuel.volume ? `${fuel.volume} L` : "N/A",
    fuel.mileage ? `${fuel.mileage} km` : "N/A",
    fuel.cost ? `$${Number(fuel.cost).toFixed(2)}` : "$0.00",
    fuel.filled_by || "N/A",
  ]);

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "Date",
        "Vehicle",
        "Fuel Type",
        "Volume",
        "Mileage",
        "Cost",
        "Filled By",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue header
      textColor: [255, 255, 255], // White text
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 10, right: 10 },
    tableWidth: pageWidth - 20,
  });
}

// Drivers table
function generateDriversTable(doc: jsPDF, data: any[], pageWidth: number) {
  const tableData = data.map((driver) => [
    driver.name || "N/A",
    driver.contact || "N/A",
    driver.license_type || "N/A",
    driver.license_number || "N/A",
    driver.license_expiry
      ? format(new Date(driver.license_expiry), "MMM dd, yyyy")
      : "N/A",
    driver.status || "N/A",
  ]);

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "Name",
        "Contact",
        "License Type",
        "License Number",
        "Expiry Date",
        "Status",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue header
      textColor: [255, 255, 255], // White text
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 10, right: 10 },
    tableWidth: pageWidth - 20,
  });
}

// Financial table
function generateFinancialTable(doc: jsPDF, data: any[], pageWidth: number) {
  const tableData = data.map((item) => [
    item.month || "N/A",
    item.revenue ? `$${Number(item.revenue).toFixed(2)}` : "$0.00",
    item.expenses ? `$${Number(item.expenses).toFixed(2)}` : "$0.00",
    item.profit ? `$${Number(item.profit).toFixed(2)}` : "$0.00",
    item.maintenance ? `$${Number(item.maintenance).toFixed(2)}` : "$0.00",
    item.fuel ? `$${Number(item.fuel).toFixed(2)}` : "$0.00",
    item.spareparts ? `$${Number(item.spareparts).toFixed(2)}` : "$0.00",
  ]);

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "Month",
        "Revenue",
        "Expenses",
        "Profit",
        "Maintenance",
        "Fuel",
        "Spare Parts",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue header
      textColor: [255, 255, 255], // White text
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 10, right: 10 },
    tableWidth: pageWidth - 20,
  });
}

// Generic table for other report types
function generateGenericTable(
  doc: jsPDF,
  data: any[],
  filename: string,
  pageWidth: number
) {
  if (data.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("No data available", 10, 50);
    return;
  }

  // Get all unique keys from the data
  const allKeys = new Set();
  data.forEach((item) => {
    Object.keys(item).forEach((key) => allKeys.add(key));
  });

  const columns = Array.from(allKeys).slice(0, 8); // Limit to 8 columns for readability
  const tableData = data.map((item) =>
    columns.map((key) => {
      const value = item[key];
      if (value === null || value === undefined) return "N/A";
      if (typeof value === "object") return JSON.stringify(value);
      if (typeof value === "boolean") return value ? "Yes" : "No";
      return String(value);
    })
  );

  autoTable(doc, {
    startY: 30,
    head: [columns.map((col) => String(col).toUpperCase())],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue header
      textColor: [255, 255, 255], // White text
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 10, right: 10 },
    tableWidth: pageWidth - 20,
  });
}

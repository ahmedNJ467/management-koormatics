import { format } from "date-fns";

// Enhanced professional table data formatting with superior text handling and alignment
export function generateTableData(data: any[], reportType: string) {
  let tableHeaders: string[] = [];
  let tableData: any[] = [];

  // Enhanced date formatting with better consistency
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const dateObj = new Date(dateStr);
      return format(dateObj, "dd/MM/yyyy");
    } catch (error) {
      return dateStr || "";
    }
  };

  // Enhanced time formatting with better handling
  const formatTimeString = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      // Handle both time-only strings and full datetime strings
      if (timeStr.includes("T") || timeStr.includes(" ")) {
        const dateObj = new Date(timeStr);
        return format(dateObj, "HH:mm");
      } else {
        // Handle time-only format like "14:30:00"
        return timeStr.substring(0, 5); // Extract HH:MM
      }
    } catch (error) {
      return timeStr.substring(0, 5) || "";
    }
  };

  // Enhanced professional text formatting with better truncation
  const formatText = (text: string, maxLength?: number) => {
    if (!text) return "";
    const cleaned = text.toString().trim();
    if (maxLength && cleaned.length > maxLength) {
      return cleaned.substring(0, maxLength - 3) + "...";
    }
    return cleaned;
  };

  // Enhanced currency formatting with better precision
  const formatCurrency = (amount: number | string) => {
    const num = Number(amount) || 0;
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Enhanced number formatting for better alignment
  const formatNumber = (value: number | string, decimals: number = 1) => {
    const num = Number(value) || 0;
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Enhanced status formatting for consistency
  const formatStatus = (status: string) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  switch (reportType) {
    case "trips-report":
      tableHeaders = [
        "DATE",
        "CLIENT / PASSENGER(S)",
        "ORGANIZATION",
        "CONTACT",
        "SERVICE TYPE",
        "PICK-UP ADDRESS",
        "DROP-OFF ADDRESS",
        "TIME",
        "CARRIER / FLIGHT #",
        "ASSIGNED VEHICLE",
        "ASSIGNED DRIVER",
      ];

      tableData = data.map((trip) => {
        // Enhanced client and passenger handling with better formatting
        const clientName = trip.clients?.name || "";
        const isOrganization = trip.clients?.type === "organization";

        let passengerDisplay = "";
        if (isOrganization && trip.passengers && trip.passengers.length > 0) {
          const mainPassengers = trip.passengers.slice(0, 2).join(", ");
          passengerDisplay =
            trip.passengers.length > 2
              ? `${mainPassengers} +${trip.passengers.length - 2}`
              : mainPassengers;
        } else if (clientName) {
          passengerDisplay = clientName;
        }

        // Enhanced vehicle display with better formatting
        const vehicleInfo = trip.vehicles
          ? `${trip.vehicles.make || ""} ${trip.vehicles.model || ""}`.trim()
          : "Not Assigned";

        // Enhanced flight details with better structure
        const carrierFlight = trip.flight_number
          ? `${trip.airline || "AIRLINE"} ${trip.flight_number}`.trim()
          : "";

        // Enhanced contact formatting
        const contactInfo = trip.clients?.phone || trip.clients?.email || "";

        return [
          formatDateString(trip.date),
          formatText(passengerDisplay.toUpperCase(), 25),
          isOrganization ? formatText(clientName.toUpperCase(), 18) : "",
          formatText(contactInfo, 15),
          formatText((trip.service_type || "Standard").toUpperCase(), 12),
          formatText((trip.pickup_location || "").toUpperCase(), 22),
          formatText((trip.dropoff_location || "").toUpperCase(), 22),
          formatTimeString(trip.time || ""),
          formatText(carrierFlight.toUpperCase(), 15),
          formatText(vehicleInfo.toUpperCase(), 18),
          formatText((trip.drivers?.name || "Not Assigned").toUpperCase(), 15),
        ];
      });
      break;

    case "vehicles-report":
      tableHeaders = [
        "Vehicle",
        "Registration",
        "Type",
        "Year",
        "Status",
        "Insurance Expiry",
      ];
      tableData = data.map((vehicle) => [
        formatText(`${vehicle.make || ""} ${vehicle.model || ""}`.trim(), 28),
        formatText(vehicle.registration || "N/A", 12),
        formatText(vehicle.type || "Unknown", 10),
        vehicle.year ? vehicle.year.toString() : "N/A",
        formatStatus(vehicle.status || "Unknown"),
        vehicle.insurance_expiry
          ? formatDateString(vehicle.insurance_expiry)
          : "Not Set",
      ]);
      break;

    case "drivers-report":
      tableHeaders = [
        "Driver Name",
        "Contact Information",
        "License Number",
        "License Type",
        "Expiry Date",
        "Status",
      ];
      tableData = data.map((driver) => [
        formatText(driver.name || "Unknown", 22),
        formatText(driver.contact || driver.phone || driver.email || "N/A", 20),
        formatText(driver.license_number || "N/A", 12),
        formatText(driver.license_type || "Unknown", 10),
        driver.license_expiry
          ? formatDateString(driver.license_expiry)
          : "Not Set",
        formatStatus(driver.status || "Unknown"),
      ]);
      break;

    case "fuel-report":
      tableHeaders = [
        "Date",
        "Vehicle",
        "Fuel Type",
        "Volume (L)",
        "Cost",
        "Mileage",
        "Efficiency",
      ];
      tableData = data.map((fuelLog) => {
        const volume = Number(fuelLog.volume || 0);
        const cost = Number(fuelLog.cost || 0);
        const mileage = Number(fuelLog.mileage || 0);
        const efficiency =
          volume > 0 && mileage > 0
            ? `${formatNumber(mileage / volume, 2)} km/L`
            : "N/A";

        return [
          formatDateString(fuelLog.date),
          fuelLog.vehicles
            ? formatText(
                `${fuelLog.vehicles.make || ""} ${
                  fuelLog.vehicles.model || ""
                }`.trim(),
                22
              )
            : "Unknown Vehicle",
          formatText(fuelLog.fuel_type || "Regular", 8),
          formatNumber(volume, 1),
          formatCurrency(cost),
          mileage > 0 ? formatNumber(mileage, 0) : "N/A",
          efficiency,
        ];
      });
      break;

    case "maintenance-report":
      tableHeaders = [
        "Date",
        "Vehicle",
        "Service Description",
        "Status",
        "Cost",
        "Service Provider",
      ];
      tableData = data.map((maintenance) => [
        formatDateString(maintenance.date),
        maintenance.vehicles
          ? formatText(
              `${maintenance.vehicles.make || ""} ${
                maintenance.vehicles.model || ""
              }`.trim(),
              22
            )
          : "Unknown Vehicle",
        formatText(maintenance.description || "No description", 35),
        formatStatus(maintenance.status || "Unknown"),
        formatCurrency(maintenance.cost || 0),
        formatText(maintenance.service_provider || "Internal", 15),
      ]);
      break;

    case "financial-report":
      tableHeaders = [
        "Date",
        "Description",
        "Category",
        "Amount",
        "Type",
        "Reference",
      ];
      tableData = data.map((financial) => [
        formatDateString(financial.date),
        formatText(financial.description || "No description", 25),
        formatText(financial.category || "General", 12),
        formatCurrency(financial.amount || 0),
        formatText(financial.type || "Expense", 10),
        formatText(financial.reference || "N/A", 15),
      ]);
      break;

    default:
      // Enhanced generic handling with better formatting
      if (data.length > 0) {
        const firstItem = data[0];
        tableHeaders = Object.keys(firstItem).map((key) =>
          formatText(
            key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            20
          )
        );
        tableData = data.map((item) =>
          Object.values(item).map((value) => {
            if (value === null || value === undefined) return "";

            // Enhanced type-specific formatting
            const stringValue = String(value);
            if (!isNaN(Number(stringValue)) && stringValue.includes(".")) {
              return formatNumber(stringValue, 2);
            } else if (stringValue.match(/^\d{4}-\d{2}-\d{2}/)) {
              return formatDateString(stringValue);
            } else {
              return formatText(stringValue, 25);
            }
          })
        );
      }
      break;
  }

  return { tableHeaders, tableData };
}

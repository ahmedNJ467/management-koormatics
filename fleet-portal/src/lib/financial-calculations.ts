import { DisplayTrip } from "./types/trip";

export type FinancialData = {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  tripCount: number;
  averageTripRevenue: number;
  monthlyData: MonthlyFinancialData[];
  expenseBreakdown: {
    maintenance: number;
    fuel: number;
    spareParts: number;
  };
  revenueBreakdown: {
    trips: number;
    vehicleLeases: number;
  };
};

export type MonthlyFinancialData = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  maintenance?: number;
  fuel?: number;
  spareParts?: number;
  tripRevenue?: number;
  leaseRevenue?: number;
};

/**
 * Calculate financial overview data from trips, maintenance, fuel logs, and spare parts
 */
export function calculateFinancialData(
  tripsData: any[] = [],
  maintenanceData: any[] = [],
  fuelData: any[] = [],
  sparePartsData: any[] = [],
  vehicleLeasesData: any[] = [],
  leaseInvoicesData: any[] = []
): FinancialData {
  // Ensure we have valid arrays
  const safeTripsData = Array.isArray(tripsData) ? tripsData : [];
  const safeMaintenanceData = Array.isArray(maintenanceData)
    ? maintenanceData
    : [];
  const safeFuelData = Array.isArray(fuelData) ? fuelData : [];
  const safeSparePartsData = Array.isArray(sparePartsData)
    ? sparePartsData
    : [];
  const safeVehicleLeasesData = Array.isArray(vehicleLeasesData)
    ? vehicleLeasesData
    : [];
  const safeLeaseInvoicesData = Array.isArray(leaseInvoicesData)
    ? leaseInvoicesData
    : [];

  // Calculate revenue from trips
  const tripRevenue = safeTripsData.reduce(
    (sum, trip) => sum + Number(trip.amount || 0),
    0
  );

  // Calculate revenue from vehicle leases (only from paid invoices)
  const leaseRevenue = safeLeaseInvoicesData
    .filter(
      (invoice) =>
        invoice.status === "paid" || invoice.invoice_status === "paid"
    )
    .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);

  const totalRevenue = tripRevenue + leaseRevenue;

  // Filter out maintenance records that are not completed
  const completedMaintenance = safeMaintenanceData.filter(
    (record) => record && record.status === "completed"
  );

  console.log(
    "Financial Calcs - Completed maintenance items:",
    completedMaintenance.length
  );

  // Calculate maintenance costs
  const maintenanceCosts = completedMaintenance.reduce(
    (sum, record) => sum + Number(record.cost || 0),
    0
  );

  // Calculate fuel costs
  const fuelCosts = safeFuelData.reduce(
    (sum, record) => sum + Number(record.cost || 0),
    0
  );

  // Calculate spare parts usage costs - only include parts that have been used
  const sparePartsCosts = safeSparePartsData.reduce((sum, part) => {
    // Only include parts with usage (quantity_used > 0) regardless of status
    const quantityUsed = Number(part.quantity_used || 0);
    if (quantityUsed > 0) {
      const costPerUnit = Number(part.unit_price || 0);
      const usageCost = quantityUsed * costPerUnit;

      console.log(
        "Part usage:",
        part.name,
        "Quantity used:",
        quantityUsed,
        "Cost per unit:",
        costPerUnit,
        "Usage cost:",
        usageCost
      );

      return sum + usageCost;
    }
    return sum;
  }, 0);

  // Calculate total expenses - include spare parts within maintenance costs
  const totalExpenses = maintenanceCosts + fuelCosts + sparePartsCosts;

  console.log("Financial Calcs - Maintenance costs:", maintenanceCosts);
  console.log("Financial Calcs - Fuel costs:", fuelCosts);
  console.log("Financial Calcs - Spare parts costs:", sparePartsCosts);
  console.log("Financial Calcs - Total expenses:", totalExpenses);

  // Calculate profit and margin
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // Calculate trip metrics
  const tripCount = safeTripsData.length;
  const averageTripRevenue = tripCount > 0 ? totalRevenue / tripCount : 0;

  // Calculate monthly data
  const monthlyData = calculateMonthlyFinancialData(
    safeTripsData,
    completedMaintenance,
    safeFuelData,
    safeSparePartsData,
    safeVehicleLeasesData,
    safeLeaseInvoicesData
  );

  return {
    totalRevenue,
    totalExpenses,
    profit,
    profitMargin,
    tripCount,
    averageTripRevenue,
    monthlyData,
    expenseBreakdown: {
      maintenance: maintenanceCosts + sparePartsCosts, // Include parts in maintenance
      fuel: fuelCosts,
      spareParts: 0, // Set to 0 since included in maintenance
    },
    revenueBreakdown: {
      trips: tripRevenue,
      vehicleLeases: leaseRevenue,
    },
  };
}

/**
 * Group financial data by month
 */
function calculateMonthlyFinancialData(
  tripsData: any[] = [],
  maintenanceData: any[] = [],
  fuelData: any[] = [],
  sparePartsData: any[] = [],
  vehicleLeasesData: any[] = [],
  leaseInvoicesData: any[] = []
): MonthlyFinancialData[] {
  const months: Record<string, MonthlyFinancialData> = {};

  // Process trips revenue by month
  if (Array.isArray(tripsData)) {
    tripsData.forEach((trip) => {
      if (!trip.date) return;

      try {
        const date = new Date(trip.date);
        if (isNaN(date.getTime())) return; // Skip invalid dates

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const monthName = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        if (!months[monthKey]) {
          months[monthKey] = {
            month: monthName,
            revenue: 0,
            expenses: 0,
            profit: 0,
            maintenance: 0,
            fuel: 0,
            spareParts: 0,
            tripRevenue: 0,
            leaseRevenue: 0,
          };
        }

        const tripAmount = Number(trip.amount || 0);
        months[monthKey].revenue += tripAmount;
        months[monthKey].tripRevenue =
          (months[monthKey].tripRevenue || 0) + tripAmount;
      } catch (error) {
        console.warn("Error processing trip date:", trip.date, error);
      }
    });
  }

  // Process vehicle lease revenue by month (only from paid invoices)
  if (Array.isArray(leaseInvoicesData)) {
    leaseInvoicesData
      .filter(
        (invoice) =>
          invoice.status === "paid" || invoice.invoice_status === "paid"
      )
      .forEach((invoice) => {
        if (!invoice.billing_period_start) return;

        try {
          const startDate = new Date(invoice.billing_period_start);
          if (isNaN(startDate.getTime())) return;

          const monthKey = `${startDate.getFullYear()}-${String(
            startDate.getMonth() + 1
          ).padStart(2, "0")}`;
          const monthName = startDate.toLocaleString("default", {
            month: "short",
            year: "numeric",
          });

          if (!months[monthKey]) {
            months[monthKey] = {
              month: monthName,
              revenue: 0,
              expenses: 0,
              profit: 0,
              maintenance: 0,
              fuel: 0,
              spareParts: 0,
              tripRevenue: 0,
              leaseRevenue: 0,
            };
          }

          const amount = Number(invoice.amount || 0);
          months[monthKey].revenue += amount;
          months[monthKey].leaseRevenue =
            (months[monthKey].leaseRevenue || 0) + amount;
        } catch (error) {
          console.warn(
            "Error processing lease invoice dates:",
            invoice.billing_period_start,
            error
          );
        }
      });
  }

  // Process maintenance expenses by month
  if (Array.isArray(maintenanceData)) {
    maintenanceData.forEach((record) => {
      if (!record.date) return;

      try {
        const date = new Date(record.date);
        if (isNaN(date.getTime())) return; // Skip invalid dates

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const monthName = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        if (!months[monthKey]) {
          months[monthKey] = {
            month: monthName,
            revenue: 0,
            expenses: 0,
            profit: 0,
            maintenance: 0,
            fuel: 0,
            spareParts: 0,
            tripRevenue: 0,
            leaseRevenue: 0,
          };
        }

        const cost = Number(record.cost || 0);
        const monthData = months[monthKey];
        if (monthData) {
          monthData.maintenance = (monthData.maintenance || 0) + cost;
          monthData.expenses = (monthData.expenses || 0) + cost;
        }
      } catch (error) {
        console.warn("Error processing maintenance date:", record.date, error);
      }
    });
  }

  // Process fuel expenses by month
  if (Array.isArray(fuelData)) {
    fuelData.forEach((record) => {
      if (!record.date) return;

      try {
        const date = new Date(record.date);
        if (isNaN(date.getTime())) return; // Skip invalid dates

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const monthName = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        if (!months[monthKey]) {
          months[monthKey] = {
            month: monthName,
            revenue: 0,
            expenses: 0,
            profit: 0,
            maintenance: 0,
            fuel: 0,
            spareParts: 0,
            tripRevenue: 0,
            leaseRevenue: 0,
          };
        }

        const cost = Number(record.cost || 0);
        const monthData = months[monthKey];
        if (monthData) {
          monthData.fuel = (monthData.fuel || 0) + cost;
          monthData.expenses = (monthData.expenses || 0) + cost;
        }
      } catch (error) {
        console.warn("Error processing fuel date:", record.date, error);
      }
    });
  }

  // Process spare parts expenses by month - only include parts that have been used
  if (Array.isArray(sparePartsData)) {
    sparePartsData.forEach((part) => {
      // Only process parts with usage (quantity_used > 0) regardless of status
      const quantityUsed = Number(part.quantity_used || 0);
      if (quantityUsed > 0) {
        const dateString = part.last_used_date || part.purchase_date;
        if (!dateString) return;

        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return; // Skip invalid dates

          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          const monthName = date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          });

          if (!months[monthKey]) {
            months[monthKey] = {
              month: monthName,
              revenue: 0,
              expenses: 0,
              profit: 0,
              maintenance: 0,
              fuel: 0,
              spareParts: 0,
            };
          }

          // Calculate cost based on quantity used and cost per unit
          const costPerUnit = Number(part.unit_price || 0);
          const cost = quantityUsed * costPerUnit;

          // Include all spare parts usage costs (maintenance cost already includes external services/parts)
          // Spare parts usage from inventory is a separate cost category
          const monthData = months[monthKey];
          if (monthData) {
            monthData.spareParts = (monthData.spareParts || 0) + cost;
            monthData.expenses = (monthData.expenses || 0) + cost;
          }
        } catch (error) {
          console.warn("Error processing spare part date:", dateString, error);
        }
      }
    });
  }

  // Calculate profit for each month
  Object.values(months).forEach((month) => {
    month.profit = month.revenue - month.expenses;
  });

  // Convert to array and sort by month
  return Object.entries(months)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([_, data]) => data);
}

/**
 * Test function to verify calculations are working correctly
 */
export function testFinancialCalculations() {
  const testTrips = [
    { amount: 100, date: "2024-01-01" },
    { amount: 200, date: "2024-01-15" },
    { amount: 150, date: "2024-02-01" },
  ];

  const testMaintenance = [
    { cost: 50, status: "completed", date: "2024-01-10" },
    { cost: 75, status: "completed", date: "2024-02-05" },
    { cost: 25, status: "pending", date: "2024-01-20" },
  ];

  const testFuel = [
    { cost: 30, date: "2024-01-05" },
    { cost: 45, date: "2024-02-01" },
  ];

  const testSpareParts = [
    { quantity_used: 2, unit_price: 10, last_used_date: "2024-01-15" },
    { quantity_used: 1, unit_price: 25, last_used_date: "2024-02-10" },
    { quantity_used: 0, unit_price: 15, last_used_date: "2024-01-20" },
  ];

  const testVehicleLeases = [
    {
      daily_rate: 50,
      monthly_rate: 1500,
      lease_status: "active",
      lease_start_date: "2024-01-01",
      lease_end_date: "2024-12-31",
    },
    {
      daily_rate: 75,
      monthly_rate: 2250,
      lease_status: "active",
      lease_start_date: "2024-02-01",
      lease_end_date: "2024-11-30",
    },
  ];

  const result = calculateFinancialData(
    testTrips,
    testMaintenance,
    testFuel,
    testSpareParts,
    testVehicleLeases,
    [] // testLeaseInvoices - empty for now
  );

  console.log("Test Results:", {
    expectedRevenue: 4200, // 450 (trips) + 3750 (leases: 1500 + 2250)
    actualRevenue: result.totalRevenue,
    expectedExpenses: 200, // 125 (maintenance including parts) + 75 (fuel)
    actualExpenses: result.totalExpenses,
    expectedProfit: 4000, // 4200 - 200
    actualProfit: result.profit,
    expectedMaintenance: 125, // 50 + 75 (maintenance) + 0 (parts already included)
    actualMaintenance: result.expenseBreakdown.maintenance,
    expectedFuel: 75,
    actualFuel: result.expenseBreakdown.fuel,
    expectedSpareParts: 0, // Set to 0 since included in maintenance
    actualSpareParts: result.expenseBreakdown.spareParts,
    expectedTripRevenue: 450,
    actualTripRevenue: result.revenueBreakdown.trips,
    expectedLeaseRevenue: 3750,
    actualLeaseRevenue: result.revenueBreakdown.vehicleLeases,
  });

  return result;
}

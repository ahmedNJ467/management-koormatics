import { CostData } from "@/lib/types/cost-analytics";

export function calculateSummaryCosts(
  maintenanceData: any[] = [],
  fuelData: any[] = [],
  sparePartsData: any[] = []
): CostData {
  // Ensure we have valid arrays, even if empty
  const safeMaintenanceData = Array.isArray(maintenanceData)
    ? maintenanceData
    : [];
  const safeFuelData = Array.isArray(fuelData) ? fuelData : [];
  const safeSparePartsData = Array.isArray(sparePartsData)
    ? sparePartsData
    : [];

  // Filter out maintenance records that are not completed
  const completedMaintenance = safeMaintenanceData.filter(
    (item) => item?.status === "completed"
  );


  // Calculate maintenance costs
  const maintenanceCosts = completedMaintenance.reduce((sum, item) => {
    const cost = Number(item?.cost || 0);
    if (isNaN(cost)) {
      console.warn(
        "Invalid maintenance cost:",
        item?.cost,
        "for item:",
        item?.id
      );
      return sum;
    }
    return sum + cost;
  }, 0);

  // Calculate fuel costs
  const fuelCosts = safeFuelData.reduce((sum, item) => {
    const cost = Number(item?.cost || 0);
    if (isNaN(cost)) {
      console.warn("Invalid fuel cost:", item?.cost, "for item:", item?.id);
      return sum;
    }
    return sum + cost;
  }, 0);

  // Calculate spare parts costs - only include parts that have been used
  const sparePartsCosts = safeSparePartsData.reduce((sum, part) => {
    // Only include parts with usage (quantity_used > 0) regardless of status
    const quantityUsed = Number(part?.quantity_used || 0);
    if (quantityUsed > 0) {
      const costPerUnit = Number(part?.unit_price || 0);

      if (isNaN(quantityUsed) || isNaN(costPerUnit)) {
        console.warn("Invalid spare part data:", {
          quantity_used: part?.quantity_used,
          unit_price: part?.unit_price,
          part_id: part?.id,
        });
        return sum;
      }

      const usageCost = quantityUsed * costPerUnit;


      return sum + usageCost;
    }
    return sum;
  }, 0);

  const costs: CostData = {
    maintenance: maintenanceCosts + sparePartsCosts, // Include parts in maintenance
    fuel: fuelCosts,
    spareParts: 0, // Set to 0 since included in maintenance
    total: 0,
  };

  costs.total = costs.maintenance + costs.fuel + costs.spareParts;

  return costs;
}


import { supabase } from "@/integrations/supabase/client";
import { createAlert } from "./alert-manager";
import { logActivity } from "./activity-logger";

// Seed alerts data
export const seedAlerts = async () => {
  // First check if there are any alerts already
  const { count, error } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error("Error checking alerts count:", error);
    return;
  }
  
  // If there are no alerts, create some sample ones
  if (count === 0) {
    const sampleAlerts = [
      {
        title: "Low fuel level detected in vehicle TRUCK-001",
        priority: "high" as const,
        type: "vehicle" as const,
        description: "Vehicle TRUCK-001 has fuel level below 15%. Refueling recommended."
      },
      {
        title: "Maintenance due for vehicle SUV-003",
        priority: "medium" as const,
        type: "maintenance" as const,
        description: "Regular maintenance due in 2 days. Schedule service appointment."
      },
      {
        title: "Driver license expiring soon - John Smith",
        priority: "medium" as const,
        type: "driver" as const,
        description: "Driver license will expire in 14 days. Renewal required."
      },
      {
        title: "Trip delayed - Airport pickup #T-2023-089",
        priority: "low" as const,
        type: "trip" as const,
        description: "Trip delayed by 15 minutes due to traffic conditions."
      }
    ];
    
    for (const alert of sampleAlerts) {
      await createAlert(alert);
    }
  }
};

// Seed activities data
export const seedActivities = async () => {
  // First check if there are any activities already
  const { count, error } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error("Error checking activities count:", error);
    return;
  }
  
  // If there are no activities, create some sample ones
  if (count === 0) {
    const sampleActivities = [
      {
        title: "Trip completed: Airport pickup #T-2023-112",
        type: "trip" as const
      },
      {
        title: "Vehicle maintenance completed for TRUCK-002",
        type: "maintenance" as const
      },
      {
        title: "New driver onboarded: Sarah Johnson",
        type: "driver" as const
      },
      {
        title: "Fuel refill: 45 gallons for SUV-001",
        type: "fuel" as const
      },
      {
        title: "New contract signed with Client XYZ Corp",
        type: "contract" as const
      },
      {
        title: "Vehicle VAN-003 added to the fleet",
        type: "vehicle" as const
      },
      {
        title: "New client onboarded: ABC Industries",
        type: "client" as const
      }
    ];
    
    for (const activity of sampleActivities) {
      await logActivity(activity);
    }
  }
};

// Initialize data
export const initializeData = async () => {
  await seedAlerts();
  await seedActivities();
};

// Call initialization
initializeData().catch(console.error);

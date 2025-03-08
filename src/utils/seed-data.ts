
import { supabase } from "@/integrations/supabase/client";

export const seedAlertData = async () => {
  // Check if there are already alerts in the database
  const { data: existingAlerts } = await supabase
    .from("alerts")
    .select("id")
    .limit(1);
  
  if (existingAlerts && existingAlerts.length > 0) {
    console.log("Alerts already exist, skipping seed");
    return;
  }

  const alerts = [
    {
      title: "Vehicle maintenance overdue",
      priority: "high",
      date: new Date().toISOString(),
      resolved: false,
      type: "maintenance",
      description: "Vehicle ABC123 is overdue for scheduled maintenance"
    },
    {
      title: "Driver license expiring soon",
      priority: "medium",
      date: new Date().toISOString(),
      resolved: false,
      type: "driver",
      description: "John Doe's license expires in 30 days"
    },
    {
      title: "Fuel consumption abnormal",
      priority: "low",
      date: new Date().toISOString(),
      resolved: false,
      type: "fuel",
      description: "Vehicle XYZ789 is showing higher than normal fuel consumption"
    },
    {
      title: "Contract renewal needed",
      priority: "medium",
      date: new Date().toISOString(),
      resolved: false,
      type: "contract",
      description: "Client ABC Corp contract expires in 15 days"
    }
  ];

  const { error } = await supabase.from("alerts").insert(alerts);
  
  if (error) {
    console.error("Error seeding alerts:", error);
  } else {
    console.log("Alerts seeded successfully");
  }
};

export const seedActivityData = async () => {
  // Check if there are already activities in the database
  const { data: existingActivities } = await supabase
    .from("activities")
    .select("id")
    .limit(1);
  
  if (existingActivities && existingActivities.length > 0) {
    console.log("Activities already exist, skipping seed");
    return;
  }

  const now = new Date();
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(now.getDate() - 1);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);

  const activities = [
    {
      title: "New trip scheduled",
      timestamp: now.toISOString(),
      type: "trip"
    },
    {
      title: "Vehicle maintenance completed",
      timestamp: oneDayAgo.toISOString(),
      type: "maintenance"
    },
    {
      title: "New driver added",
      timestamp: twoDaysAgo.toISOString(),
      type: "driver"
    },
    {
      title: "Fuel refill recorded",
      timestamp: threeDaysAgo.toISOString(),
      type: "fuel"
    },
    {
      title: "Contract renewed",
      timestamp: threeDaysAgo.toISOString(),
      type: "contract"
    }
  ];

  const { error } = await supabase.from("activities").insert(activities);
  
  if (error) {
    console.error("Error seeding activities:", error);
  } else {
    console.log("Activities seeded successfully");
  }
};

export const seedData = async () => {
  await seedAlertData();
  await seedActivityData();
};

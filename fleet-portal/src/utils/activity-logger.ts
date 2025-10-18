import { ActivityItemProps } from "@/types/dashboard";
import { supabase } from "@/integrations/supabase/client";
import { checkSupabaseConnection } from "./supabase-helpers";

// Feature flag to disable activity logging if database issues persist
// Set to false to completely disable database activity logging
const ENABLE_ACTIVITY_LOGGING = false;

type ActivityType =
  | "trip"
  | "maintenance"
  | "vehicle"
  | "driver"
  | "client"
  | "fuel"
  | "contract";

interface ActivityLogParams {
  title: string;
  type: ActivityType;
  relatedId?: string;
  tripDetails?: {
    clientName?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
  };
}

// Format trip ID to display format (first 8 characters, uppercase)
const formatTripId = (tripId: string): string => {
  if (!tripId) return "";
  return tripId.substring(0, 8).toUpperCase();
};

// Format timestamps in a human-readable format (currently unused)
// const formatTimestamp = (date: Date): string => {
//   const now = new Date();
//   const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
//   if (diffInSeconds < 60) {
//     return "just now";
//   } else if (diffInSeconds < 3600) {
//     const minutes = Math.floor(diffInSeconds / 60);
//     return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
//   } else if (diffInSeconds < 86400) {
//     const hours = Math.floor(diffInSeconds / 3600);
//     return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
//   } else {
//     const days = Math.floor(diffInSeconds / 86400);
//     return `${days} day${days !== 1 ? "s" : ""} ago`;
//   }
// };

// Add a new activity to the database
export const logActivity = async ({
  title,
  type,
  relatedId,
  tripDetails,
}: ActivityLogParams): Promise<ActivityItemProps> => {
  const id = Date.now().toString();
  const timestamp = new Date();

  // Enhanced icon mapping
  const iconMap: Record<ActivityType, string> = {
    trip: "calendar",
    maintenance: "clock",
    vehicle: "car",
    driver: "user",
    client: "building",
    fuel: "fuel",
    contract: "file-check",
  };

  // Create more detailed titles for trip activities with formatted IDs
  let enhancedTitle = title;
  if (type === "trip" && relatedId) {
    const formattedTripId = formatTripId(relatedId);
    enhancedTitle = `Trip ${formattedTripId} ${
      title.toLowerCase().includes("created") ? "created" : "updated"
    }`;
  }

  const newActivity: ActivityItemProps = {
    id,
    title: enhancedTitle,
    timestamp: timestamp.toISOString(),
    type,
    icon: iconMap[type] || "activity",
    related_id: relatedId,
  };

  // Save to the database with better error handling
  try {
    // Skip database operations if activity logging is disabled
    if (!ENABLE_ACTIVITY_LOGGING) {
      console.log(
        "Activity logging disabled, returning local activity:",
        enhancedTitle
      );
      return newActivity;
    }

    // Check if connection is healthy before attempting to save
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.warn(
        "Database connection not available, activity not saved:",
        enhancedTitle
      );
      return newActivity;
    }

    // Check if activities table exists and has the right schema
    const { data: tableExists, error: tableError } = await supabase
      .from("activities")
      .select("id")
      .limit(1);

    if (tableError && tableError.code === "PGRST116") {
      console.warn(
        "Activities table does not exist, skipping activity log:",
        enhancedTitle
      );
      return newActivity;
    }

    const { data, error } = await supabase.from("activities").insert([
      {
        title: enhancedTitle,
        type,
        related_id: relatedId,
        timestamp: timestamp.toISOString(),
      } as any,
    ]);

    if (error) {
      // Check if it's a schema/column error or any database error
      if (
        error.code === "PGRST116" ||
        error.message?.includes("column") ||
        error.message?.includes("relation") ||
        error.code === "23502" || // not_null_violation
        error.code === "23503" || // foreign_key_violation
        error.code === "23505" || // unique_violation
        Object.keys(error).length === 0
      ) {
        // empty error object
        console.warn(
          "Activities table schema mismatch or database error, skipping activity log:",
          enhancedTitle
        );
      } else {
        console.error("Error saving activity to database:", error);
      }
      // Still return the activity object for local use
    } else {
      console.log("Activity logged successfully:", enhancedTitle);
    }
  } catch (err) {
    console.error("Failed to log activity to database:", err);
    // Continue execution even if database save fails
  }

  return newActivity;
};

// Get activities from the database
export const getActivities = async (
  limit?: number
): Promise<ActivityItemProps[]> => {
  try {
    // Skip database operations if activity logging is disabled
    if (!ENABLE_ACTIVITY_LOGGING) {
      console.log("Activity logging disabled, returning empty activities list");
      return [];
    }

    // Check connection health first
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.warn("Database connection not available for fetching activities");
      return [];
    }

    // Check if activities table exists first
    const { data: tableExists, error: tableError } = await supabase
      .from("activities")
      .select("id")
      .limit(1);

    if (tableError && tableError.code === "PGRST116") {
      console.warn(
        "Activities table does not exist, returning empty activities list"
      );
      return [];
    }

    const query = supabase
      .from("activities")
      .select("*")
      .order("timestamp", { ascending: false });

    if (limit) {
      query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching activities:", error);
      return [];
    }

    const normalizeTitle = (raw: string): string => {
      if (!raw) return "Unknown activity";
      let t = raw;

      // Fix concatenated "created" after ID (e.g., "Trip ABCD1234reated")
      t = t.replace(/(\b[Tt]rip\s+[A-Z0-9]{6,12})reated\b:?/g, "$1 created");

      // Remove location names from trip activities
      // Pattern: "Trip ID: Location1 to Location2" -> "Trip ID"
      t = t.replace(
        /(\b[Tt]rip\s+[A-Z0-9]{6,12})\s*:?\s*[^:]+(?:\s+to\s+[^:]+)?/g,
        "$1"
      );

      // Remove client names in parentheses
      t = t.replace(/\s*\([^)]+\)/g, "");

      // Remove " - ClientName" patterns
      t = t.replace(/\s*-\s*[^-]+$/g, "");

      // Ensure space between Trip <ID> and following verb when missing
      t = t.replace(
        /(\b[Tt]rip\s+[A-Z0-9]{6,12})(?=(created|updated|assigned|completed)\b)/g,
        "$1 "
      );

      // Clean up any extra spaces
      t = t.replace(/\s+/g, " ").trim();

      return t;
    };

    return data.map((item: any) => {
      let formattedTitle = item.title;

      // Format trip IDs in existing activity titles
      if (item.type === "trip" && item.related_id) {
        const formattedTripId = formatTripId(item.related_id);
        // Replace any existing trip ID format with the new format
        formattedTitle = item.title.replace(
          /trip\s+[a-f0-9-]+/gi,
          `Trip ${formattedTripId}`
        );
      }

      // Apply normalization fixes
      formattedTitle = normalizeTitle(formattedTitle);

      return {
        id: item.id.toString(),
        title: formattedTitle,
        timestamp: item.timestamp,
        type: item.type as ActivityType,
        icon: item.type as ActivityType,
        related_id: item.related_id,
      };
    });
  } catch (err) {
    console.error("Failed to fetch activities:", err);
    return [];
  }
};

// Enhanced trip activity logging with proper trip details
export const logTripActivity = async (
  action: string,
  tripId: string,
  tripData?: any
): Promise<void> => {
  try {
    // Fetch trip details to create a meaningful activity
    const { data: trip, error } = await supabase
      .from("trips")
      .select(
        `
        *,
        clients:client_id(name),
        vehicles:vehicle_id(make, model, registration),
        drivers:driver_id(name)
      `
      )
      .eq("id", tripId as any)
      .single();

    if (error || !trip) {
      console.warn("Could not fetch trip details for activity logging");
      return;
    }

    const clientName = (trip as any).clients?.name || "Unknown Client";
    const vehicleDetails = (trip as any).vehicles
      ? `${(trip as any).vehicles.make} ${(trip as any).vehicles.model}`
      : "Unknown Vehicle";
    const driverName = (trip as any).drivers?.name || "Unassigned Driver";
    const formattedTripId = formatTripId(tripId);

    let title = "";
    switch (action) {
      case "created":
        title = `New Trip ${formattedTripId} created`;
        break;
      case "updated":
        title = `Trip ${formattedTripId} updated`;
        break;
      case "assigned":
        title = `Vehicle assigned to trip ${formattedTripId}`;
        break;
      case "driver_assigned":
        title = `Driver assigned to trip ${formattedTripId}`;
        break;
      case "completed":
        title = `Trip ${formattedTripId} completed`;
        break;
      default:
        title = `Trip ${formattedTripId} ${action}`;
    }

    await logActivity({
      title,
      type: "trip",
      relatedId: tripId,
      tripDetails: {
        clientName,
        pickupLocation: (trip as any).pickup_location,
        dropoffLocation: (trip as any).dropoff_location,
      },
    });
  } catch (err) {
    console.error("Error logging trip activity:", err);
  }
};

// Generate sample activities if needed (for development/testing)
export const generateSampleActivities = async (): Promise<void> => {
  try {
    // Check connection first
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.warn(
        "Database connection not available for generating sample activities"
      );
      return;
    }

    const { data, error } = await supabase
      .from("activities")
      .select("count")
      .single();

    // Only seed if there are no activities and no error occurred
    if (!error && data && (data as any).count === 0) {
      const sampleActivities: ActivityLogParams[] = [
        {
          title: "Trip completed: Airport pickup",
          type: "trip",
        },
        {
          title: "Vehicle maintenance completed for TRUCK-002",
          type: "maintenance",
        },
        {
          title: "New driver onboarded: Sarah Johnson",
          type: "driver",
        },
        {
          title: "Fuel refill: 45 gallons for SUV-001",
          type: "fuel",
        },
        {
          title: "New contract signed with Client XYZ Corp",
          type: "contract",
        },
        {
          title: "Vehicle VAN-003 added to the fleet",
          type: "vehicle",
        },
        {
          title: "New client onboarded: ABC Industries",
          type: "client",
        },
      ];

      // Add sample activities to database
      for (const activity of sampleActivities) {
        await logActivity(activity);
      }

      console.log("Sample activities generated");
    }
  } catch (err) {
    console.error("Failed to generate sample activities:", err);
  }
};

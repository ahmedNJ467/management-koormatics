
import { supabase } from "@/integrations/supabase/client";
import { Alert } from "@/types/alert";

type AlertPriority = 'high' | 'medium' | 'low';
type AlertType = 'maintenance' | 'driver' | 'fuel' | 'vehicle' | 'trip' | 'contract';

interface CreateAlertParams {
  title: string;
  priority: AlertPriority;
  type: AlertType;
  description?: string;
  relatedId?: string;
  relatedType?: string;
}

// Create a new alert
export const createAlert = async ({
  title,
  priority,
  type,
  description,
  relatedId,
  relatedType
}: CreateAlertParams): Promise<Alert | null> => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert([
        {
          title,
          priority,
          type,
          description,
          related_id: relatedId,
          related_type: relatedType,
          resolved: false,
          date: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating alert:", error);
      return null;
    }
    
    console.log("Alert created:", data);
    return data as Alert;
    
  } catch (err) {
    console.error("Failed to create alert:", err);
    return null;
  }
};

// Resolve an existing alert
export const resolveAlert = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('alerts')
      .update({ resolved: true })
      .eq('id', id);
    
    if (error) {
      console.error("Error resolving alert:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Failed to resolve alert:", err);
    return false;
  }
};

// Generate sample alerts
export const generateSampleAlerts = async (): Promise<void> => {
  // First check if we already have alerts
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .limit(1);
  
  if (error || (data && data.length === 0)) {
    // Add sample alerts
    const sampleAlerts: CreateAlertParams[] = [
      {
        title: "Low fuel level detected in vehicle TRUCK-001",
        priority: "high",
        type: "vehicle",
        description: "Vehicle TRUCK-001 has fuel level below 15%. Refueling recommended."
      },
      {
        title: "Maintenance due for vehicle SUV-003",
        priority: "medium",
        type: "maintenance",
        description: "Regular maintenance due in 2 days. Schedule service appointment."
      },
      {
        title: "Driver license expiring soon - John Smith",
        priority: "medium",
        type: "driver",
        description: "Driver license will expire in 14 days. Renewal required."
      },
      {
        title: "Trip delayed - Airport pickup #T-2023-089",
        priority: "low",
        type: "trip",
        description: "Trip delayed by 15 minutes due to traffic conditions."
      }
    ];
    
    for (const alert of sampleAlerts) {
      await createAlert(alert);
    }
  }
};

// Initialize with sample data
generateSampleAlerts();


import { useState } from "react";
import { AlertItemProps } from "@/types/dashboard";
import { initialAlerts } from "@/data/dashboard/mock-data";

export function useAlertsData() {
  const [recentAlerts] = useState<AlertItemProps[]>(initialAlerts);
  
  return { recentAlerts };
}

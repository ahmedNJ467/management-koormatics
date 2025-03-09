
import { AlertTriangle } from "lucide-react";

export const AlertsTab = () => {
  return (
    <div className="text-center py-6 text-muted-foreground">
      <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
      <p>Alerts feature temporarily disabled</p>
    </div>
  );
};

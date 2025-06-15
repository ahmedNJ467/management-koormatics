
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImprovedAlertsTab } from "@/components/dashboard/ImprovedAlertsTab";

export function AlertsDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-96 bg-background border shadow-lg z-50" 
        align="end" 
        forceMount
      >
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg shadow-lg">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">System Alerts</h3>
              <p className="text-sm text-muted-foreground">Critical notifications & warnings</p>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <ImprovedAlertsTab />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

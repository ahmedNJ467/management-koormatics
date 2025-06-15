
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImprovedAlertsTab } from "@/components/dashboard/ImprovedAlertsTab";
import { useAlertsData } from "@/hooks/use-alerts-data";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AlertsDropdown() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { alerts } = useAlertsData({ activeOnly: true });

  const unreadCount = alerts?.filter(alert => !alert.resolved).length || 0;

  // Set up real-time listener for alert changes
  useEffect(() => {
    const channelName = 'alerts-dropdown-realtime-' + Math.random().toString(36).substring(7);
    
    const alertsChannel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'alerts' 
      }, (payload) => {
        console.log('Real-time alert update in dropdown:', payload);
        // Invalidate queries to refresh alert count
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
        queryClient.invalidateQueries({ queryKey: ["improved-alerts"] });
      })
      .subscribe();
    
    console.log('AlertsDropdown real-time subscription activated');
    
    return () => {
      console.log('Cleaning up AlertsDropdown real-time subscription');
      supabase.removeChannel(alertsChannel);
    };
  }, [queryClient]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[28rem] bg-background shadow-lg z-50" 
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
          <ScrollArea className="h-80">
            <div className="pr-4">
              <ImprovedAlertsTab />
            </div>
          </ScrollArea>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { realtimeManager } from "@/utils/realtime-manager";
import { useToast } from "@/hooks/use-toast";

export function ConnectionStatus() {
  const { toast } = useToast();
  const [status, setStatus] = useState<{
    isConnected: boolean;
    retryCount: number;
    lastAttempt: number;
    websocketStatus: "connecting" | "connected" | "disconnected" | "error";
    lastPing?: number;
  }>({
    isConnected: false,
    retryCount: 0,
    lastAttempt: 0,
    websocketStatus: "disconnected",
  });

  useEffect(() => {
    const updateStatus = () => {
      const newStatus = realtimeManager.getConnectionStatus();
      const wasConnected = status.isConnected;

      setStatus(newStatus);

      // Show toast notifications for status changes
      if (wasConnected && !newStatus.isConnected) {
        toast({
          title: "Connection Lost",
          description: "Attempting to reconnect...",
          duration: 5000,
        });
      }
    };

    // Update status every 2 seconds
    const interval = setInterval(updateStatus, 2000);
    updateStatus(); // Initial update

    return () => clearInterval(interval);
  }, [status.isConnected, toast]);

  if (status.isConnected && status.websocketStatus === "connected") {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <Wifi className="h-4 w-4" />
        <span>Connected</span>
        {status.lastPing && (
          <span className="text-xs text-muted-foreground">
            ({Math.round((Date.now() - status.lastPing) / 1000)}s ago)
          </span>
        )}
      </div>
    );
  }

  if (status.websocketStatus === "connecting" || status.retryCount > 0) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>
          {status.websocketStatus === "connecting"
            ? "Connecting..."
            : `Reconnecting... (${status.retryCount}/5)`}
        </span>
      </div>
    );
  }

  if (
    !status.isConnected ||
    status.websocketStatus === "disconnected" ||
    status.websocketStatus === "error"
  ) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>Disconnected</span>
        <button
          onClick={() => {
            try {
              toast({
                title: "Reconnecting...",
                description: "Attempting to restore connection",
                duration: 2000,
              });
              realtimeManager.forceReconnect();
            } catch (error) {
              console.error("Manual reconnection failed:", error);
              toast({
                title: "Reconnection Failed",
                description: "Please try again or refresh the page",
                variant: "destructive",
                duration: 5000,
              });
            }
          }}
          className="text-xs underline hover:no-underline cursor-pointer"
        >
          Retry
        </button>
        <button
          onClick={async () => {
            try {
              toast({
                title: "Enabling realtime for alerts...",
                description: "This may take a few seconds",
                duration: 3000,
              });
              const success = await realtimeManager.enableRealtimeForTable(
                "alerts"
              );
              if (success) {
                toast({
                  title: "Realtime enabled",
                  description: "Alerts table realtime has been configured",
                  duration: 3000,
                });
              } else {
                toast({
                  title: "Realtime setup failed",
                  description: "Check console for details",
                  variant: "destructive",
                  duration: 5000,
                });
              }
            } catch (error) {
              console.error("Manual realtime setup failed:", error);
              toast({
                title: "Realtime setup failed",
                description: "Please check console for details",
                variant: "destructive",
                duration: 5000,
              });
            }
          }}
          className="text-xs underline hover:no-underline cursor-pointer ml-2"
        >
          Enable Alerts Realtime
        </button>
      </div>
    );
  }
}

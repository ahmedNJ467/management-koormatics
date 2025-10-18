"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCacheInvalidation } from "@/hooks/use-cache-invalidation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Cache Control Component
 * Provides manual cache clearing options for users
 * Can be added to admin/settings pages if needed
 */
export default function CacheControl() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const {
    clearAllCaches,
    refreshAuthData,
    refreshCoreData,
    invalidateSpecificQueries,
    forcePageRefresh,
  } = useCacheInvalidation();

  const handleRefreshAuth = async () => {
    setIsLoading(true);
    try {
      await refreshAuthData();
      toast({
        title: "Authentication Data Refreshed",
        description: "User roles and permissions have been refreshed.",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to refresh authentication data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshCoreData = async () => {
    setIsLoading(true);
    try {
      await refreshCoreData();
      toast({
        title: "Core Data Refreshed",
        description: "Trips, vehicles, and drivers data has been refreshed.",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to refresh core data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllCaches = async () => {
    setIsLoading(true);
    try {
      await clearAllCaches();
      toast({
        title: "All Caches Cleared",
        description:
          "All cached data has been cleared. You may need to refresh the page.",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to clear caches.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceRefresh = () => {
    forcePageRefresh();
  };

  const handleInvalidateSpecific = async () => {
    setIsLoading(true);
    try {
      invalidateSpecificQueries([
        ["trips"],
        ["vehicles"],
        ["drivers"],
        ["clients"],
        ["maintenance"],
        ["fuel_logs"],
      ]);
      toast({
        title: "Specific Queries Invalidated",
        description: "Selected queries have been invalidated and will refetch.",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to invalidate queries.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Cache Control
        </CardTitle>
        <CardDescription>
          Manage application caches to ensure you see the latest data. Use these
          options if you notice stale or outdated information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Refresh Auth Data */}
          <Button
            onClick={handleRefreshAuth}
            disabled={isLoading}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="font-medium">Refresh Auth Data</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              Refresh user roles, permissions, and authentication state
            </span>
          </Button>

          {/* Refresh Core Data */}
          <Button
            onClick={handleRefreshCoreData}
            disabled={isLoading}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="font-medium">Refresh Core Data</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              Refresh trips, vehicles, drivers, and clients data
            </span>
          </Button>

          {/* Invalidate Specific Queries */}
          <Button
            onClick={handleInvalidateSpecific}
            disabled={isLoading}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="font-medium">Invalidate Queries</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              Invalidate specific data queries for fresh data
            </span>
          </Button>

          {/* Clear All Caches */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isLoading}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span className="font-medium">Clear All Caches</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  Clear all cached data and browser storage
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Clear All Caches
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all cached data including authentication
                  state, React Query cache, browser storage, and service worker
                  caches. You may need to log in again after this action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllCaches}>
                  Clear All Caches
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Force Page Refresh */}
        <div className="pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isLoading}
                variant="destructive"
                className="w-full h-auto p-4 flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span className="font-medium">Force Page Refresh</span>
                </div>
                <span className="text-xs text-center">
                  Nuclear option: Clear everything and reload the page
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Force Page Refresh
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all caches, storage, and reload the entire
                  page. This is the most aggressive option and should resolve
                  any persistent caching issues.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleForceRefresh}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Force Refresh
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center pt-2">
          <Badge variant="secondary" className="text-xs">
            {isLoading ? "Processing..." : "Ready"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  MessageSquare,
  Navigation,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsProps {
  onRefresh: () => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (filter: string) => void;
  refreshing: boolean;
  searchTerm: string;
  currentFilter: string;
}

export function QuickActions({
  onRefresh,
  onSearchChange,
  onFilterChange,
  refreshing,
  searchTerm,
  currentFilter,
}: QuickActionsProps) {
  const { toast } = useToast();

  const handleEmergencyAlert = () => {
    toast({
      title: "Emergency Alert Sent",
      description: "All active drivers have been notified",
      variant: "destructive",
    });
  };

  const handleBroadcastMessage = () => {
    toast({
      title: "Broadcast Message",
      description: "Feature coming soon - send messages to all drivers",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Trip data is being prepared for download",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Search and Filters */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-card to-card/80 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trips, drivers, locations..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={currentFilter} onValueChange={onFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trips</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={onRefresh}
              disabled={refreshing}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleBroadcastMessage}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Broadcast
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleEmergencyAlert}>
              <AlertTriangle className="h-4 w-4 mr-1" />
              Emergency
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Create New</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Plus className="h-4 w-4 mr-2" />
                  New Trip
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Navigation className="h-4 w-4 mr-2" />
                  Route Plan
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="h-4 w-4 mr-2" />
                  Alert
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
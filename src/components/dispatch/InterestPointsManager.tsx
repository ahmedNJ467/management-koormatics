import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInterestPoints } from "@/hooks/use-interest-points";
import {
  InterestPoint,
  INTEREST_POINT_CATEGORIES,
} from "@/lib/types/interest-point";
import {
  MapPin,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import { AddInterestPointDialog } from "./AddInterestPointDialog";
import { EditInterestPointDialog } from "./EditInterestPointDialog";
import { DeleteInterestPointDialog } from "./DeleteInterestPointDialog";

interface InterestPointsManagerProps {
  onInterestPointSelected?: (point: InterestPoint) => void;
  onInterestPointUpdated?: () => void;
}

export function InterestPointsManager({
  onInterestPointSelected,
  onInterestPointUpdated,
}: InterestPointsManagerProps) {
  const { interestPoints, isLoading, error, refetch } = useInterestPoints();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<InterestPoint | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("all");

  const filteredPoints = (interestPoints as InterestPoint[]).filter((point) => {
    const matchesSearch =
      point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (point.description &&
        point.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" || point.category === selectedCategory;
    const matchesActive = showInactive ? true : point.is_active;

    return matchesSearch && matchesCategory && matchesActive;
  });

  // Separate points by category for tabs
  const activePoints = filteredPoints.filter((point) => point.is_active);
  const inactivePoints = filteredPoints.filter((point) => !point.is_active);
  const airportPoints = filteredPoints.filter(
    (point) => point.category === "airport"
  );
  const portPoints = filteredPoints.filter(
    (point) => point.category === "port"
  );
  const marketPoints = filteredPoints.filter(
    (point) => point.category === "market"
  );
  const cityPoints = filteredPoints.filter(
    (point) => point.category === "city"
  );
  const securityPoints = filteredPoints.filter(
    (point) => point.category === "security"
  );
  const fuelPoints = filteredPoints.filter(
    (point) => point.category === "fuel"
  );
  const healthPoints = filteredPoints.filter(
    (point) => point.category === "health"
  );
  const otherPoints = filteredPoints.filter(
    (point) =>
      ![
        "airport",
        "port",
        "market",
        "city",
        "security",
        "fuel",
        "health",
      ].includes(point.category)
  );

  const handleEdit = (point: InterestPoint) => {
    setSelectedPoint(point);
    setEditDialogOpen(true);
  };

  const handleDelete = (point: InterestPoint) => {
    setSelectedPoint(point);
    setDeleteDialogOpen(true);
  };

  const handleInterestPointUpdated = () => {
    refetch();
    onInterestPointUpdated?.();
  };

  const getCategoryInfo = (category: string) => {
    return (
      INTEREST_POINT_CATEGORIES.find((cat) => cat.value === category) ||
      INTEREST_POINT_CATEGORIES[INTEREST_POINT_CATEGORIES.length - 1]
    );
  };

  const renderPointsList = (points: InterestPoint[]) => {
    if (points.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No interest points found</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {points.map((point) => {
          const categoryInfo = getCategoryInfo(point.category);
          return (
            <div
              key={point.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => onInterestPointSelected?.(point)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-2xl" style={{ color: point.color }}>
                  {point.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{point.name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {categoryInfo.label}
                    </Badge>
                    <span className="text-xs">
                      {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                    </span>
                  </div>
                  {point.description && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {point.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(point);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(point);
                  }}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading interest points...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Failed to load interest points
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header with search and controls */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <h2 className="font-semibold">
                Interest Points ({filteredPoints.length})
              </h2>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              size="sm"
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Point
            </Button>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search interest points..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[140px] h-8">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {INTEREST_POINT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
              className="h-8 px-3"
            >
              {showInactive ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <div className="px-3 pt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs">
                  All ({activePoints.length})
                </TabsTrigger>
                <TabsTrigger value="airport" className="text-xs">
                  Airport ({airportPoints.length})
                </TabsTrigger>
                <TabsTrigger value="port" className="text-xs">
                  Port ({portPoints.length})
                </TabsTrigger>
                <TabsTrigger value="city" className="text-xs">
                  City ({cityPoints.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <TabsContent value="all" className="mt-0">
                {renderPointsList(activePoints)}
              </TabsContent>
              <TabsContent value="airport" className="mt-0">
                {renderPointsList(airportPoints)}
              </TabsContent>
              <TabsContent value="port" className="mt-0">
                {renderPointsList(portPoints)}
              </TabsContent>
              <TabsContent value="city" className="mt-0">
                {renderPointsList(cityPoints)}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      {addDialogOpen && (
        <AddInterestPointDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onInterestPointAdded={handleInterestPointUpdated}
        />
      )}

      {editDialogOpen && selectedPoint && (
        <EditInterestPointDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          interestPoint={selectedPoint}
          onInterestPointUpdated={handleInterestPointUpdated}
        />
      )}

      {deleteDialogOpen && selectedPoint && (
        <DeleteInterestPointDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          interestPoint={selectedPoint}
          onInterestPointDeleted={handleInterestPointUpdated}
        />
      )}
    </>
  );
}

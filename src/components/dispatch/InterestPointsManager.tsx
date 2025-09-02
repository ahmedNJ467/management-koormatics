import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interest Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading interest points...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interest Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg
                className="h-12 w-12 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Interest Points
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred"}
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <p>Please check:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your Supabase environment variables are configured</li>
                <li>The database migration has been run</li>
                <li>Your internet connection is stable</li>
              </ul>
            </div>
            <Button
              onClick={() => refetch()}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Interest Points ({filteredPoints.length})
            </CardTitle>
            <Button onClick={() => setAddDialogOpen(true)} size="sm">
              Add Point
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search interest points..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {INTEREST_POINT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Interest Points List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No interest points found</p>
                {searchQuery || selectedCategory !== "all" ? (
                  <p className="text-sm">
                    Try adjusting your search or filters
                  </p>
                ) : (
                  <p className="text-sm">
                    Create your first interest point to get started
                  </p>
                )}
              </div>
            ) : (
              filteredPoints.map((point) => {
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
                            {point.latitude.toFixed(4)},{" "}
                            {point.longitude.toFixed(4)}
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddInterestPointDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onInterestPointAdded={handleInterestPointUpdated}
      />

      {selectedPoint && (
        <>
          <EditInterestPointDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            interestPoint={selectedPoint}
            onInterestPointUpdated={handleInterestPointUpdated}
          />
          <DeleteInterestPointDialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            interestPoint={selectedPoint}
            onInterestPointDeleted={handleInterestPointUpdated}
          />
        </>
      )}
    </>
  );
}

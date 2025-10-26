import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InterestPointService } from "@/lib/services/interest-point-service";
import {
  CreateInterestPointData,
  UpdateInterestPointData,
  InterestPoint,
} from "@/lib/types/interest-point";
import { useToast } from "@/hooks/use-toast";

export const useInterestPoints = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: interestPoints = [] as InterestPoint[],
    isLoading,
    error,
    refetch,
  } = useQuery<InterestPoint[]>({
    queryKey: ["interest-points"],
    queryFn: InterestPointService.getAllInterestPoints,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false, // Don't refetch
    refetchOnWindowFocus: false, // Don't refetch
    retry: (failureCount, error) => {
      // Don't retry on authentication or table not found errors
      if (error instanceof Error) {
        if (
          error.message.includes("Authentication error") ||
          error.message.includes("Database table not found")
        ) {
          return false;
        }
      }
      return failureCount < 3;
    },
    // Note: onError is deprecated in newer versions of React Query
  });

  const createMutation = useMutation({
    mutationFn: InterestPointService.createInterestPoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interest-points"] });
      toast({
        title: "Success",
        description: "Interest point created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating interest point:", {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        stringified: JSON.stringify(error, null, 2),
      });
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create interest point";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInterestPointData }) =>
      InterestPointService.updateInterestPoint(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interest-points"] });
      toast({
        title: "Success",
        description: "Interest point updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating interest point:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update interest point";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: InterestPointService.deleteInterestPoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interest-points"] });
      toast({
        title: "Success",
        description: "Interest point deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting interest point:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete interest point";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: InterestPointService.deactivateInterestPoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interest-points"] });
      toast({
        title: "Success",
        description: "Interest point deactivated successfully",
      });
    },
    onError: (error) => {
      console.error("Error deactivating interest point:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to deactivate interest point";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const createInterestPoint = (data: CreateInterestPointData) => {
    createMutation.mutate(data);
  };

  const updateInterestPoint = (id: string, data: UpdateInterestPointData) => {
    updateMutation.mutate({ id, data });
  };

  const deleteInterestPoint = (id: string) => {
    deleteMutation.mutate(id);
  };

  const deactivateInterestPoint = (id: string) => {
    deactivateMutation.mutate(id);
  };

  return {
    interestPoints,
    isLoading,
    error,
    refetch,
    createInterestPoint,
    updateInterestPoint,
    deleteInterestPoint,
    deactivateInterestPoint,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
  };
};

export const useInterestPointsByCategory = (category: string) => {
  return useQuery({
    queryKey: ["interest-points", "category", category],
    queryFn: () => InterestPointService.getInterestPointsByCategory(category),
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInterestPointById = (id: string) => {
  return useQuery({
    queryKey: ["interest-points", "id", id],
    queryFn: () => InterestPointService.getInterestPointById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInterestPointsInBounds = (
  north: number,
  south: number,
  east: number,
  west: number
) => {
  return useQuery({
    queryKey: ["interest-points", "bounds", north, south, east, west],
    queryFn: () =>
      InterestPointService.getInterestPointsInBounds(north, south, east, west),
    enabled: !!(north && south && east && west),
    staleTime: 2 * 60 * 1000, // 2 minutes for bounds queries
  });
};

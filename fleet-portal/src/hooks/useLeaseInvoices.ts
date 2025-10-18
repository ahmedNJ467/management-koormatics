import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  generateMonthlyLeaseInvoices,
  getLeaseInvoiceDetails,
  updateLeaseInvoiceStatus,
  LeaseInvoiceData,
} from "@/lib/lease-invoice-generator";

export function useLeaseInvoices(leaseId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query to get lease invoice details
  const {
    data: leaseInvoices = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lease-invoices", leaseId],
    queryFn: () => getLeaseInvoiceDetails(leaseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to generate monthly invoices
  const generateInvoicesMutation = useMutation({
    mutationFn: generateMonthlyLeaseInvoices,
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Invoices Generated Successfully",
          description: `Generated ${result.generatedCount} invoices for the current month.`,
        });
      } else {
        toast({
          title: "Invoice Generation Completed with Errors",
          description: `${result.generatedCount} invoices generated, ${result.errors.length} errors occurred.`,
          variant: "destructive",
        });
      }

      // Invalidate and refetch lease invoices
      queryClient.invalidateQueries({ queryKey: ["lease-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Generate Invoices",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation to update lease invoice status
  const updateStatusMutation = useMutation({
    mutationFn: ({
      leaseInvoiceId,
      status,
    }: {
      leaseInvoiceId: string;
      status: string;
    }) => updateLeaseInvoiceStatus(leaseInvoiceId, status),
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Lease invoice status updated successfully.",
      });

      // Invalidate and refetch lease invoices
      queryClient.invalidateQueries({ queryKey: ["lease-invoices"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Status",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  return {
    leaseInvoices,
    isLoading,
    error,
    refetch,
    generateInvoices: generateInvoicesMutation.mutate,
    isGenerating: generateInvoicesMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
  };
}

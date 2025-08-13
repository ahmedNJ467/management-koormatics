import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentTrips() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(
          `id, date, time, status, service_type,
           clients:client_id(name),
           drivers:driver_id(name),
           vehicles:vehicle_id(registration)`
        )
        .order("date", { ascending: false })
        .order("time", { ascending: false })
        .limit(5); // Reduced from 8 to 5 for more compact display
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="h-8">
            <TableHead className="w-[100px] text-xs py-2">When</TableHead>
            <TableHead className="text-xs py-2">Client</TableHead>
            <TableHead className="text-xs py-2">Driver</TableHead>
            <TableHead className="text-xs py-2">Vehicle</TableHead>
            <TableHead className="text-xs py-2">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((t: any) => (
            <TableRow key={t.id} className="h-8">
              <TableCell className="text-xs py-1">
                {new Date(
                  t.date + "T" + (t.time || "00:00:00")
                ).toLocaleString()}
              </TableCell>
              <TableCell className="truncate max-w-[150px] text-xs py-1">
                {t.clients?.name || "-"}
              </TableCell>
              <TableCell className="truncate max-w-[120px] text-xs py-1">
                {t.drivers?.name || "-"}
              </TableCell>
              <TableCell className="truncate max-w-[100px] text-xs py-1">
                {t.vehicles?.registration || "-"}
              </TableCell>
              <TableCell className="capitalize text-xs py-1">
                {t.status || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

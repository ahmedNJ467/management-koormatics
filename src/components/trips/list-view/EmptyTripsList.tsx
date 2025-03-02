
import { TableRow, TableCell } from "@/components/ui/table";

export function EmptyTripsList() {
  return (
    <TableRow>
      <TableCell colSpan={8} className="text-center py-8">
        No trips found. Try adjusting your search or create a new trip.
      </TableCell>
    </TableRow>
  );
}

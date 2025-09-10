import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Calendar, List, PlusCircle, ChevronLeft, LayoutGrid } from "lucide-react";

export function DispatchHeader() {
  const router = useRouter();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">
          Dispatch Center
        </h2>
        <p className="text-muted-foreground">
          Assign drivers to trips and manage your fleet
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/trips">
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">View Trips</span>
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1"
          onClick={() => router.push("/drivers")}
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Manage Drivers</span>
        </Button>
      </div>
    </div>
  );
}


import { Button } from "@/components/ui/button";
import { Calendar, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";

export function DispatchHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Dispatch Center</h2>
        <p className="text-muted-foreground">
          Assign drivers to trips and manage your fleet
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Link to="/trips">
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">View Trips</span>
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-1"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = "/drivers";
          }}
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Manage Drivers</span>
        </Button>
      </div>
    </div>
  );
}

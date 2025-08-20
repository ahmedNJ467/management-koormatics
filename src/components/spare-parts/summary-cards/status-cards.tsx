
import { Package, Tag, AlertTriangle } from "lucide-react";
import { StatusCard } from "./status-card";
import { SparePart } from "../types";

interface StatusCardsProps {
  inStockParts: SparePart[];
  lowStockParts: SparePart[];
  outOfStockParts: SparePart[];
}

export const StatusCards = ({ inStockParts, lowStockParts, outOfStockParts }: StatusCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatusCard
        title="In Stock"
        description="Ready to use parts"
        count={inStockParts.length}
        icon={<Package className="mr-2 h-5 w-5" />}
        colorClass="green"
        subtitle="Available parts"
      />
      
      <StatusCard
        title="Low Stock"
        description="Below minimum level"
        count={lowStockParts.length}
        icon={<Tag className="mr-2 h-5 w-5" />}
        colorClass="yellow"
        subtitle="Need attention"
      />
      
      <StatusCard
        title="Out of Stock"
        description="Unavailable parts"
        count={outOfStockParts.length}
        icon={<AlertTriangle className="mr-2 h-5 w-5" />}
        colorClass="red"
        subtitle="Need reordering"
      />
    </div>
  );
};

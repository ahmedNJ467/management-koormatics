
import { Badge } from "@/components/ui/badge";

type StatusType = "in_stock" | "low_stock" | "out_of_stock";

interface PartStatusBadgeProps {
  status: StatusType;
}

export const PartStatusBadge = ({ status }: PartStatusBadgeProps) => {
  const statusStyles = {
    in_stock: "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400 border-green-200 dark:border-green-800/30",
    low_stock: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30",
    out_of_stock: "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400 border-red-200 dark:border-red-800/30",
  };

  const statusLabels = {
    in_stock: "In Stock",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
  };

  return (
    <Badge className={`${statusStyles[status]} font-medium`} variant="outline">
      {statusLabels[status]}
    </Badge>
  );
};

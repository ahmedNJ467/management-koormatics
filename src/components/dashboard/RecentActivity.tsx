
import { ActivityItemProps } from "@/types/dashboard";
import { FileText } from "lucide-react";

interface RecentActivityProps {
  isLoading?: boolean;
  activities?: ActivityItemProps[];
}

export const RecentActivity = ({ isLoading = false }: RecentActivityProps) => {
  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading activities...</div>;
  }

  return (
    <div className="text-center py-6 text-muted-foreground">
      <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
      <p>Activity feature temporarily disabled</p>
    </div>
  );
};


import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCardProps } from "@/types/dashboard";
import { getIconComponent } from "@/utils/icon-utils";

export const StatCard = ({ stat }: { stat: StatCardProps }) => {
  const IconComponent = getIconComponent(stat.icon);
  
  return (
    <Card key={stat.name} className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {stat.name}
        </CardTitle>
        <div
          className={`rounded-full p-2.5 ${
            stat.changeType === "positive"
              ? "bg-green-100 text-green-600 dark:bg-green-900/30"
              : stat.changeType === "negative"
              ? "bg-red-100 text-red-600 dark:bg-red-900/30"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800"
          }`}
        >
          {IconComponent && <IconComponent className="h-4 w-4" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className={`text-xs ${
            stat.changeType === "positive"
              ? "text-green-600"
              : stat.changeType === "negative"
              ? "text-red-600"
              : "text-gray-600"
          } flex items-center mt-1`}>
          {stat.changeType === "positive" ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : stat.changeType === "negative" ? (
            <TrendingDown className="h-3 w-3 mr-1" />
          ) : null}
          {stat.change} from last month
        </p>
      </CardContent>
    </Card>
  );
};

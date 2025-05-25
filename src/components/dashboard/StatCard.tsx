
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCardProps } from "@/types/dashboard";
import { getIconComponent } from "@/utils/icon-utils";

export const StatCard = ({ stat }: { stat: StatCardProps }) => {
  const IconComponent = getIconComponent(stat.icon);
  
  return (
    <Card key={stat.name} className="overflow-hidden bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">
          {stat.name}
        </CardTitle>
        <div
          className={`rounded-full p-2.5 ${
            stat.changeType === "positive"
              ? "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400"
              : stat.changeType === "negative"
              ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {IconComponent && <IconComponent className="h-4 w-4" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
        <p className={`text-xs ${
            stat.changeType === "positive"
              ? "text-green-600 dark:text-green-400"
              : stat.changeType === "negative"
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
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

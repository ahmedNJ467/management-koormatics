
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatusCardProps {
  title: string;
  description: string;
  count: number;
  icon: ReactNode;
  colorClass: string;
  subtitle: string;
}

export const StatusCard = ({
  title,
  description,
  count,
  icon,
  colorClass,
  subtitle
}: StatusCardProps) => {
  return (
    <Card className={`overflow-hidden border-${colorClass}-100 dark:border-${colorClass}-900/30`}>
      <CardHeader className={`bg-${colorClass}-50 dark:bg-${colorClass}-900/20 pb-2`}>
        <CardTitle className={`flex items-center text-${colorClass}-700 dark:text-${colorClass}-400`}>
          {icon}
          {title}
        </CardTitle>
        <CardDescription className={`text-${colorClass}-600/80 dark:text-${colorClass}-400/80`}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className={`text-3xl font-bold text-${colorClass}-700 dark:text-${colorClass}-400`}>{count}</div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

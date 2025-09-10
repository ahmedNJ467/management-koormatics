import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReactNode } from "react";

type StatusType = "green" | "yellow" | "red";

interface StatusCardProps {
  title: string;
  description: string;
  count: number;
  icon: ReactNode;
  colorClass: StatusType;
  subtitle: string;
}

const getStatusStyles = (colorClass: StatusType) => {
  const styles = {
    green: {
      card: "overflow-hidden border-green-100 dark:border-green-900/30",
      header: "bg-green-50 dark:bg-green-900/20 pb-2",
      title: "flex items-center text-green-700 dark:text-green-400",
      description: "text-green-600/80 dark:text-green-400/80",
      count: "text-3xl font-bold text-green-700 dark:text-green-400",
    },
    yellow: {
      card: "overflow-hidden border-yellow-100 dark:border-yellow-900/30",
      header: "bg-yellow-50 dark:bg-yellow-900/20 pb-2",
      title: "flex items-center text-yellow-700 dark:text-yellow-400",
      description: "text-yellow-600/80 dark:text-yellow-400/80",
      count: "text-3xl font-bold text-yellow-700 dark:text-yellow-400",
    },
    red: {
      card: "overflow-hidden border-red-100 dark:border-red-900/30",
      header: "bg-red-50 dark:bg-red-900/20 pb-2",
      title: "flex items-center text-red-700 dark:text-red-400",
      description: "text-red-600/80 dark:text-red-400/80",
      count: "text-3xl font-bold text-red-700 dark:text-red-400",
    },
  };

  return styles[colorClass];
};

export const StatusCard = ({
  title,
  description,
  count,
  icon,
  colorClass,
  subtitle,
}: StatusCardProps) => {
  const styles = getStatusStyles(colorClass);

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <CardTitle className={styles.title}>
          {icon}
          {title}
        </CardTitle>
        <CardDescription className={styles.description}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className={styles.count}>{count}</div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

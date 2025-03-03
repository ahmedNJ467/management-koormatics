
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PerformanceMetric } from "@/hooks/use-dashboard-performance";
import { Badge } from "@/components/ui/badge";

interface PerformanceMetricsTableProps {
  metrics: PerformanceMetric[];
}

export function PerformanceMetricsTable({ metrics }: PerformanceMetricsTableProps) {
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'query':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case 'render':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case 'data-load':
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  // Sort metrics by start time (most recent first)
  const sortedMetrics = [...metrics].sort((a, b) => b.startTime - a.startTime);

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operation</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Duration (ms)</TableHead>
            <TableHead className="text-right">Data Size</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMetrics.length > 0 ? (
            sortedMetrics.map((metric, index) => (
              <TableRow key={`${metric.name}-${index}`}>
                <TableCell className="font-medium">{metric.name}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getTypeBadgeColor(metric.type)}`}
                  >
                    {metric.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {metric.duration.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {metric.dataSize ? `${(metric.dataSize / 1024).toFixed(2)} KB` : '-'}
                </TableCell>
                <TableCell>
                  {metric.startTime > 0 ? 
                    new Date(performance.timing.navigationStart + metric.startTime).toLocaleTimeString() : 
                    '-'
                  }
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No metrics collected yet. Enable monitoring and interact with the dashboard.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

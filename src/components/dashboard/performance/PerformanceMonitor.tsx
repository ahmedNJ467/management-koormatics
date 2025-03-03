
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PerformanceMetric, useDashboardPerformance } from "@/hooks/use-dashboard-performance";
import { Activity, BarChart2, Clock, Database, Eye, EyeOff, RotateCcw } from "lucide-react";
import { PerformanceMetricsTable } from "./PerformanceMetricsTable";
import { QueryTimeChart } from "./QueryTimeChart";
import { RenderPerformanceChart } from "./RenderPerformanceChart";

export function PerformanceMonitor() {
  const { 
    metrics, 
    report, 
    generateReport, 
    resetMetrics, 
    toggleMonitoring, 
    isMonitoring 
  } = useDashboardPerformance();

  const handleGenerateReport = () => {
    generateReport();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Dashboard Performance Monitor</CardTitle>
          <CardDescription>
            Track query times, data usage, and render performance
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleMonitoring}
          >
            {isMonitoring ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {isMonitoring ? "Disable" : "Enable"} Monitoring
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetMetrics}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button 
            size="sm" 
            onClick={handleGenerateReport}
            disabled={metrics.length === 0}
          >
            <Activity className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {report && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Avg Query Time</p>
                  <h3 className="text-2xl font-bold">{report.averageQueryTime.toFixed(2)} ms</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Database className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Total Data Size</p>
                  <h3 className="text-2xl font-bold">{(report.totalDataSize / 1024).toFixed(2)} KB</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <BarChart2 className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Avg Render Time</p>
                  <h3 className="text-2xl font-bold">{report.averageRenderTime.toFixed(2)} ms</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Activity className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Metrics Collected</p>
                  <h3 className="text-2xl font-bold">{metrics.length}</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="metrics">
          <TabsList className="mb-4">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="query-chart">Query Performance</TabsTrigger>
            <TabsTrigger value="render-chart">Render Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <PerformanceMetricsTable metrics={metrics} />
          </TabsContent>

          <TabsContent value="query-chart">
            <QueryTimeChart metrics={metrics} />
          </TabsContent>

          <TabsContent value="render-chart">
            <RenderPerformanceChart metrics={metrics} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <p className="text-xs text-muted-foreground">
            {isMonitoring ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                Monitoring Active
              </Badge>
            ) : (
              <Badge variant="outline">Monitoring Paused</Badge>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

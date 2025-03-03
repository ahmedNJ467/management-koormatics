import { PerformanceMetric } from "@/hooks/use-dashboard-performance";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface QueryTimeChartProps {
  metrics: PerformanceMetric[];
}

export function QueryTimeChart({ metrics }: QueryTimeChartProps) {
  // Filter for query metrics and get the most recent 10
  const queryMetrics = metrics
    .filter(m => m.type === 'query' && m.duration > 0)
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, 10)
    .reverse();

  // Format data for the chart
  const chartData = queryMetrics.map(metric => {
    const queryName = metric.name.includes('Query:') 
      ? metric.name.split('Query:')[1].trim() 
      : metric.name;
      
    // Extract just the query type from the stringified query key
    let shortName = queryName;
    try {
      const parsedKey = JSON.parse(queryName);
      if (Array.isArray(parsedKey) && parsedKey.length > 0) {
        shortName = Array.isArray(parsedKey[0]) 
          ? parsedKey[0].join('/') 
          : parsedKey[0];
      }
    } catch (e) {
      // Keep original name if parsing fails
    }
    
    return {
      name: shortName.length > 20 ? shortName.substring(0, 20) + '...' : shortName,
      duration: parseFloat(metric.duration.toFixed(2)),
      dataSize: metric.dataSize ? Math.round(metric.dataSize / 1024) : 0, // KB
    };
  });

  if (queryMetrics.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          No query metrics collected yet. Interact with the dashboard to collect data.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="pt-6 pl-6">
          <h3 className="text-lg font-medium">Recent Query Performance</h3>
          <p className="text-sm text-muted-foreground">Duration (ms) and data size (KB) by query</p>
        </div>
        <div className="h-[350px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs" 
                angle={-45} 
                textAnchor="end" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
              <Bar 
                dataKey="duration" 
                name="Duration (ms)" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="dataSize" 
                name="Data Size (KB)" 
                fill="hsl(var(--secondary))" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

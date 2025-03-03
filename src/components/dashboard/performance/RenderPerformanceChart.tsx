
import { PerformanceMetric } from "@/hooks/use-dashboard-performance";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RenderPerformanceChartProps {
  metrics: PerformanceMetric[];
}

export function RenderPerformanceChart({ metrics }: RenderPerformanceChartProps) {
  // Filter for render metrics
  const renderMetrics = metrics
    .filter(m => m.type === 'render' && m.duration > 0)
    .sort((a, b) => a.startTime - b.startTime);

  // Format data for the chart with sequential numbering
  const chartData = renderMetrics.map((metric, index) => {
    return {
      id: index + 1,
      duration: parseFloat(metric.duration.toFixed(2)),
      timestamp: new Date(performance.timing.navigationStart + metric.startTime).toLocaleTimeString()
    };
  });

  if (renderMetrics.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          No render metrics collected yet. Interact with the dashboard to collect data.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="pt-6 pl-6">
          <h3 className="text-lg font-medium">Render Performance Over Time</h3>
          <p className="text-sm text-muted-foreground">Dashboard render durations (ms)</p>
        </div>
        <div className="h-[350px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="id" 
                label={{ value: 'Render Sequence', position: 'insideBottom', offset: -10 }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                labelFormatter={(value) => `Render #${value}`}
                formatter={(value, name) => [value, 'Duration (ms)']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="duration" 
                stroke="hsl(var(--primary))" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

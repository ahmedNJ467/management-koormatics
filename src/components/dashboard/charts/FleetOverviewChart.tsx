
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyData } from '@/data/dashboard/mock-data';

export const FleetOverviewChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-muted-foreground text-xs" />
        <YAxis className="text-muted-foreground text-xs" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}
          labelStyle={{ fontWeight: 'bold' }}
        />
        <Bar dataKey="vehicles" fill="hsl(var(--primary))" name="Total Vehicles" radius={[4, 4, 0, 0]} />
        <Bar dataKey="maintenance" fill="hsl(var(--destructive))" name="In Maintenance" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

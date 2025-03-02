
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fuelConsumptionData } from '@/data/dashboard/mock-data';

export const FuelConsumptionChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={fuelConsumptionData}>
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
          formatter={(value) => [`${value} L`, 'Consumption']}
        />
        <Line 
          type="monotone" 
          dataKey="consumption" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

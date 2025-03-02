
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fuelCostData } from '@/data/dashboard/mock-data';

export const FuelCostsChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={fuelCostData}>
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
          formatter={(value) => [`$${value}`, '']}
        />
        <Legend />
        <Bar dataKey="diesel" name="Diesel" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="petrol" name="Petrol" fill="#10B981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};


import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyData } from '@/data/dashboard/mock-data';

export const FinancialOverviewChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={monthlyData}>
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
          formatter={(value) => [`$${value}`, '']}
        />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#10B981" 
          name="Revenue"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="costs" 
          stroke="#EF4444" 
          name="Costs"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="profit" 
          stroke="#3B82F6" 
          name="Profit"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

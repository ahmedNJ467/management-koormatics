
import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { name: "Jan", active: 20, maintenance: 5, inactive: 3 },
  { name: "Feb", active: 22, maintenance: 4, inactive: 2 },
  { name: "Mar", active: 25, maintenance: 3, inactive: 2 },
  { name: "Apr", active: 28, maintenance: 6, inactive: 2 },
  { name: "May", active: 30, maintenance: 4, inactive: 1 },
  { name: "Jun", active: 32, maintenance: 5, inactive: 3 },
];

export const Overview = () => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="active" stackId="a" fill="#4ade80" name="Active Vehicles" />
        <Bar dataKey="maintenance" stackId="a" fill="#facc15" name="In Maintenance" />
        <Bar dataKey="inactive" stackId="a" fill="#f87171" name="Inactive" />
      </BarChart>
    </ResponsiveContainer>
  );
};

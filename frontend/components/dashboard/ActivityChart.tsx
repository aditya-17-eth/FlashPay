"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function ActivityChart() {
  const { data: raw, isLoading } = useQuery({
     queryKey: ["transactions_chart"],
     queryFn: async () => {
       const res = await fetch("/api/transactions");
       return res.json();
     },
     refetchInterval: 5000,
  });

  if (isLoading || !raw) return <div className="h-64 bg-gray-900 animate-pulse rounded-3xl" />;

  const dataArray = Array.isArray(raw) ? raw : [];
  // Group by day for the chart since we don't have a direct daily rollup endpoint fully implemented for charts
  const grouped = dataArray.reduce((acc: any, tx: any) => {
      const date = new Date(tx.created_at || Date.now()).toLocaleDateString();
      if (!acc[date]) acc[date] = { date, count: 0 };
      acc[date].count += 1;
      return acc;
  }, {});

  const chartData = Object.values(grouped).reverse(); // Oldest first

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 h-80 flex flex-col justify-between hover:border-gray-700 transition">
       <h3 className="text-gray-400 font-medium tracking-wide text-sm flex items-center gap-2 mb-6 uppercase">
          <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block" />
          Recent Daily Runs
       </h3>
       
       <div className="flex-1 w-full min-h-0">
         <ResponsiveContainer width="100%" height="100%">
           <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
             <XAxis 
                dataKey="date" 
                stroke="#4b5563" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dy={10}
             />
             <YAxis 
                stroke="#4b5563" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dx={-10}
             />
             <Tooltip 
               contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "0.75rem", padding: "12px 16px" }}
               itemStyle={{ color: "#fff", fontWeight: 600 }}
               cursor={{ fill: "rgba(255,255,255,0.05)", radius: 8 }}
             />
             <Bar 
                dataKey="count" 
                fill="#3b82f6" 
                radius={[6, 6, 6, 6]}
                className="fill-blue-500" 
                activeBar={{ fill: "#60a5fa" }}
             />
           </BarChart>
         </ResponsiveContainer>
       </div>
    </div>
  );
}

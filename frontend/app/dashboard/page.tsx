"use client";

import { useQuery } from "@tanstack/react-query";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { TransactionLog } from "@/components/dashboard/TransactionLog";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { PieChart } from "lucide-react";

export default function DashboardPage() {
  const { data: metrics } = useQuery({
     queryKey: ["metrics"],
     queryFn: async () => {
       const res = await fetch("/api/metrics");
       return res.json();
     },
     refetchInterval: 10000,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end">
         <div>
             <h1 className="text-3xl font-bold flex items-center gap-3 mb-2 text-white">
                 <PieChart className="text-blue-500" size={28} />
                 Dashboard
             </h1>
             <p className="text-gray-400">Real-time statistics running over the FlashPay contract.</p>
         </div>
      </div>
      
      <MetricsGrid data={metrics || null} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
         <ActivityChart />
         <TransactionLog />
      </div>
    </div>
  );
}

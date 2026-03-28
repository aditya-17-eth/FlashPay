"use client";

import { Users, Activity, DollarSign, Cpu } from "lucide-react";

interface MetricsProps {
  data: {
    totalUsers: number;
    totalRuns: number;
    totalVolumeUsdc: number;
    toolBreakdown: { image: number; summarise: number; pdf: number; code: number };
  } | null;
}

export function MetricsGrid({ data }: MetricsProps) {
  if (!data) return <div className="animate-pulse flex h-32 bg-gray-900 rounded-3xl" />;

  const mostUsed = Object.entries(data.toolBreakdown).sort((a, b) => b[1] - a[1])[0];

  const cards = [
    { title: "Total Users", value: data.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Total Runs", value: data.totalRuns, icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Total Volume", value: `${data.totalVolumeUsdc.toLocaleString()} USDC`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { 
      title: "Most Used Tool", 
      value: mostUsed ? mostUsed[0].toUpperCase() : "N/A", 
      subValue: `${mostUsed ? mostUsed[1] : 0} runs`,
      icon: Cpu, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10" 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => {
         const Icon = card.icon;
         return (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col justify-between hover:border-gray-700 transition">
               <div className="flex justify-between items-start mb-4">
                  <span className="text-gray-400 font-medium">{card.title}</span>
                  <div className={`p-2 rounded-xl ${card.bg}`}>
                     <Icon size={20} className={card.color} />
                  </div>
               </div>
               <div className="flex items-end justify-between">
                  <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
                  {card.subValue && <span className="text-sm text-gray-500 font-mono mb-1">{card.subValue}</span>}
               </div>
            </div>
         );
      })}
    </div>
  );
}

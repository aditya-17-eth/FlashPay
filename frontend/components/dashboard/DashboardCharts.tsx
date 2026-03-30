"use client";

import { useMemo } from "react";

interface Transaction {
  created_at: string;
}

interface DashboardChartsProps {
  transactions: Transaction[];
}

export function DashboardCharts({ transactions }: DashboardChartsProps) {
  const chartData = useMemo(() => {
    const grouped = transactions.reduce<Record<string, { date: string; count: number }>>(
      (accumulator, transaction) => {
        // Grouping by local date string from the user's perspective
        const date = new Date(transaction.created_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        });
        if (!accumulator[date]) {
          accumulator[date] = { date, count: 0 };
        }
        accumulator[date].count += 1;
        return accumulator;
      },
      {},
    );

    return Object.values(grouped).reverse().slice(0, 7);
  }, [transactions]);

  const maxChartCount = useMemo(() => {
    return chartData.reduce((max, item) => Math.max(max, item.count), 0) || 1;
  }, [chartData]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 h-80 flex flex-col justify-between hover:border-gray-700 transition">
      <h3 className="text-gray-400 font-medium tracking-wide text-sm flex items-center gap-2 mb-6 uppercase">
        <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block" />
        Recent Daily Runs
      </h3>

      <div className="flex-1 w-full min-h-0 flex items-end gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {chartData.length > 0 ? (
          chartData.map((item) => (
            <div key={item.date} className="flex-1 min-w-[32px] h-full flex flex-col justify-end items-center gap-3">
              <div className="w-full h-full flex items-end">
                <div
                  className="w-full rounded-xl bg-blue-500/90 shadow-[0_0_24px_rgba(59,130,246,0.25)] transition-all"
                  style={{
                    height: `${Math.max((item.count / maxChartCount) * 100, 8)}%`,
                  }}
                  title={`${item.count} runs on ${item.date}`}
                />
              </div>
              <div className="text-xs text-gray-500 text-center truncate w-full font-mono uppercase tracking-tighter">
                {item.date}
              </div>
            </div>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded-2xl border border-dashed border-gray-800 text-sm text-gray-500">
            No recent runs yet.
          </div>
        )}
      </div>
    </div>
  );
}

import { unstable_noStore as noStore } from "next/cache";
import {
  PieChart,
  Users,
  Activity,
  DollarSign,
  Cpu,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { getServiceSupabase } from "@/lib/supabase";
import { captureException } from "@/lib/sentry";

type ToolName = "image" | "summarise" | "pdf" | "code";

type Transaction = {
  amount_usdc: number | string;
  created_at: string;
  id: string;
  payer: string;
  status: "pending" | "released" | "refunded" | "failed";
  tool: ToolName;
};

type DashboardData = {
  toolBreakdown: Record<ToolName, number>;
  totalRuns: number;
  totalUsers: number;
  totalVolumeUsdc: number;
  transactions: Transaction[];
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STELLAR_EXPLORER_ACCOUNT_BASE_URL = "https://stellar.expert/explorer/testnet/account";

function getToolBadgeClasses(tool: ToolName) {
  if (tool === "image") return "bg-pink-500/10 text-pink-400 border-pink-500/20";
  if (tool === "summarise") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  if (tool === "pdf") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-blue-500/10 text-blue-400 border-blue-500/20";
}

function getChartData(transactions: Transaction[]) {
  const grouped = transactions.reduce<Record<string, { date: string; count: number }>>(
    (accumulator, transaction) => {
      const date = new Date(transaction.created_at).toLocaleDateString();
      if (!accumulator[date]) {
        accumulator[date] = { date, count: 0 };
      }
      accumulator[date].count += 1;
      return accumulator;
    },
    {},
  );

  return Object.values(grouped).reverse();
}

function getMaxChartCount(chartData: Array<{ count: number }>) {
  return chartData.reduce((max, item) => Math.max(max, item.count), 0) || 1;
}

async function loadDashboardData(): Promise<DashboardData> {
  noStore();

  const supabase = getServiceSupabase();
  const [
    { data: recentTransactions, error: recentTransactionsError },
    { count: totalUsers, error: totalUsersError },
    { count: totalRuns, error: totalRunsError },
    { count: imageCount, error: imageCountError },
    { count: summariseCount, error: summariseCountError },
    { count: pdfCount, error: pdfCountError },
    { count: codeCount, error: codeCountError },
    { data: releasedTransactions, error: releasedTransactionsError },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("id,payer,tool,amount_usdc,status,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("tool", "image"),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("tool", "summarise"),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("tool", "pdf"),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("tool", "code"),
    supabase.from("transactions").select("amount_usdc").eq("status", "released"),
  ]);

  if (recentTransactionsError) throw recentTransactionsError;
  if (totalUsersError) throw totalUsersError;
  if (totalRunsError) throw totalRunsError;
  if (imageCountError) throw imageCountError;
  if (summariseCountError) throw summariseCountError;
  if (pdfCountError) throw pdfCountError;
  if (codeCountError) throw codeCountError;
  if (releasedTransactionsError) throw releasedTransactionsError;

  const totalVolumeUsdc =
    releasedTransactions?.reduce((sum, transaction) => sum + Number(transaction.amount_usdc || 0), 0) || 0;

  return {
    toolBreakdown: {
      image: imageCount || 0,
      summarise: summariseCount || 0,
      pdf: pdfCount || 0,
      code: codeCount || 0,
    },
    totalRuns: totalRuns || 0,
    totalUsers: totalUsers || 0,
    totalVolumeUsdc,
    transactions: (recentTransactions || []) as Transaction[],
  };
}

export default async function DashboardPage() {
  try {
    const data = await loadDashboardData();
    const chartData = getChartData(data.transactions);
    const maxChartCount = getMaxChartCount(chartData);
    const mostUsedTool = Object.entries(data.toolBreakdown).sort((a, b) => b[1] - a[1])[0];
    const cards = [
      {
        title: "Total Users",
        value: data.totalUsers,
        icon: Users,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      },
      {
        title: "Total Runs",
        value: data.totalRuns,
        icon: Activity,
        color: "text-green-500",
        bg: "bg-green-500/10",
      },
      {
        title: "Total Volume",
        value: `${data.totalVolumeUsdc.toLocaleString()} USDC`,
        icon: DollarSign,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      },
      {
        title: "Most Used Tool",
        value: mostUsedTool ? mostUsedTool[0].toUpperCase() : "N/A",
        subValue: `${mostUsedTool ? mostUsedTool[1] : 0} runs`,
        icon: Cpu,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
      },
    ];

    return (
      <>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col justify-between hover:border-gray-700 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-gray-400 font-medium">{card.title}</span>
                    <div className={`p-2 rounded-xl ${card.bg}`}>
                      <Icon size={20} className={card.color} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
                    {"subValue" in card && card.subValue ? (
                      <span className="text-sm text-gray-500 font-mono mb-1">{card.subValue}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 h-80 flex flex-col justify-between hover:border-gray-700 transition">
              <h3 className="text-gray-400 font-medium tracking-wide text-sm flex items-center gap-2 mb-6 uppercase">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block" />
                Recent Daily Runs
              </h3>

              <div className="flex-1 w-full min-h-0 flex items-end gap-4">
                {chartData.length > 0 ? (
                  chartData.map((item) => (
                    <div key={item.date} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-3">
                      <div className="w-full h-full flex items-end">
                        <div
                          className="w-full rounded-xl bg-blue-500/90 shadow-[0_0_24px_rgba(59,130,246,0.25)] transition-all"
                          style={{
                            height: `${Math.max((item.count / maxChartCount) * 100, 8)}%`,
                          }}
                          title={`${item.count} runs`}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-center truncate w-full">
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

            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden backdrop-blur-3xl shadow-2xl">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-xl font-bold font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  Recent Activity
                </h3>
                <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full border border-gray-700 font-mono tracking-widest uppercase shadow-inner">
                  Live Sync
                </span>
              </div>

              <div className="overflow-x-auto relative">
                <table className="w-full text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-black/40 border-b border-gray-800/50 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-4 font-semibold tracking-wider w-1/5">Time</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Tool</th>
                      <th className="px-6 py-4 font-semibold tracking-wider w-1/4">Payer</th>
                      <th className="px-6 py-4 font-semibold tracking-wider text-right">Amount (USDC)</th>
                      <th className="px-6 py-4 font-semibold tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {data.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-800/20 transition-colors group">
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                          {new Date(tx.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getToolBadgeClasses(tx.tool)}`}
                          >
                            {tx.tool.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-300">
                          <div className="flex items-center gap-2 group-hover:text-white transition-colors">
                            {tx.payer.substring(0, 4)}...{tx.payer.substring(52)}
                            <a
                              href={`${STELLAR_EXPLORER_ACCOUNT_BASE_URL}/${tx.payer}`}
                              target="_blank"
                              rel="noreferrer"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-right text-gray-300 tabular-nums">
                          {tx.amount_usdc}
                        </td>
                        <td className="px-6 py-4 flex justify-center">
                          {tx.status === "released" ? (
                            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                              <CheckCircle2 size={14} /> Settled
                            </span>
                          ) : tx.status === "refunded" || tx.status === "failed" ? (
                            <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                              <XCircle size={14} /> Refunded
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs text-yellow-400 font-medium bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20 animate-pulse">
                              <Clock size={14} /> Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {data.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                          No transactions yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    captureException(error);

    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2 text-white">
            <PieChart className="text-blue-500" size={28} />
            Dashboard
          </h1>
          <p className="text-gray-400">Real-time statistics running over the FlashPay contract.</p>
        </div>

        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          Dashboard sync failed. {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }
}

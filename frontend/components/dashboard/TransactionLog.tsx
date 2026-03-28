"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, CheckCircle2, Clock, XCircle } from "lucide-react";

export function TransactionLog() {
  const { data: txs, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions");
      return res.json();
    },
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="h-64 bg-gray-900 animate-pulse rounded-3xl" />;

  const txArray = Array.isArray(txs) ? txs : [];

  return (
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
            {txArray.map((tx: any) => (
              <tr key={tx.id || Math.random()} className="hover:bg-gray-800/20 transition-colors group">
                <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                  {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                     tx.tool === "image" ? "bg-pink-500/10 text-pink-400 border-pink-500/20" :
                     tx.tool === "summarise" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                     tx.tool === "pdf" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                     "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {tx.tool.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-300">
                  <div className="flex items-center gap-2 group-hover:text-white transition-colors">
                      {tx.payer.substring(0, 4)}...{tx.payer.substring(52)}
                      <a 
                        href={`https://testnet.stellar.expert/explorer/account/${tx.payer}`}
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
                  ) : tx.status === "refunded" ? (
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

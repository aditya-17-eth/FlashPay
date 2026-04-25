"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2, X, Zap, Clock } from "lucide-react";
import {
  getActiveSession,
  saveSession,
  clearSession,
  SessionState,
  formatTimeRemaining,
  estimateRemainingUses,
} from "@/lib/session";
import { createSessionOnChain, closeSessionOnChain } from "@/lib/stellar";
import { TOOL_PRICES } from "@/lib/prices";

const PRESETS = [
  { label: "5 uses",  amount: 0.025, desc: "Light" },
  { label: "10 uses", amount: 0.05,  desc: "Standard" },
  { label: "25 uses", amount: 0.125, desc: "Power" },
];

const SESSION_DURATION_SECS = 3600; // 1 hour

export function SessionManager({ walletAddress }: { walletAddress: string }) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state
  useEffect(() => {
    setSession(getActiveSession());
  }, []);

  // Periodically refresh (for timer + auto-expiry)
  useEffect(() => {
    const interval = setInterval(() => {
      setSession(getActiveSession());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleCreate(budget: number) {
    setCreating(true);
    setError(null);
    try {
      const maxPerTx = Math.max(...Object.values(TOOL_PRICES));
      await createSessionOnChain(budget, maxPerTx, SESSION_DURATION_SECS);

      const newSession: SessionState = {
        ownerAddress: walletAddress,
        budgetTotal: budget,
        budgetRemaining: budget,
        maxPerTx,
        expiresAt: Date.now() + SESSION_DURATION_SECS * 1000,
        createdAt: Date.now(),
      };

      saveSession(newSession);
      setSession(newSession);
      setShowPanel(false);
    } catch (e: any) {
      setError(e.message || "Failed to create session");
    }
    setCreating(false);
  }

  async function handleClose() {
    setClosing(true);
    setError(null);
    try {
      await closeSessionOnChain();
      clearSession();
      setSession(null);
    } catch (e: any) {
      setError(e.message || "Failed to close session");
    }
    setClosing(false);
  }

  // ── Active session badge ──
  if (session) {
    const remaining = estimateRemainingUses(session);
    const timeLeft = formatTimeRemaining(session);

    return (
      <div className="flex items-center gap-3 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg shadow-sm">
        <Zap size={14} className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
        <div className="flex flex-col">
          <span className="text-xs text-green-400 font-mono font-bold leading-tight">Session Active</span>
          <span className="text-[10px] text-gray-500 font-mono leading-tight">
            {session.budgetRemaining.toFixed(3)} USDC · {timeLeft}
          </span>
        </div>
        <button
          onClick={handleClose}
          disabled={closing}
          className="ml-2 text-gray-500 hover:text-red-400 transition"
          title="End Session"
        >
          {closing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
        </button>
        {error && <p className="absolute top-full left-0 mt-1 text-[10px] text-red-400 font-mono whitespace-nowrap">{error}</p>}
      </div>
    );
  }

  // ── Create session button / panel ──
  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
          showPanel 
            ? "bg-gray-800 border-gray-700 text-white" 
            : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
        }`}
      >
        <Shield size={14} />
        Smart Session
      </button>

      {showPanel && (
        <div className="absolute right-0 top-full mt-3 w-64 bg-gray-900 border border-gray-700 shadow-2xl shadow-blue-900/10 rounded-xl p-3 z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-200 font-bold flex items-center gap-1.5">
              <Shield size={12} className="text-blue-400" />
              Configure Session
            </span>
            <button
              onClick={() => { setShowPanel(false); setError(null); }}
              className="text-gray-500 hover:text-white transition"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
            Deposit USDC once. All tools bypass Freighter popups for 1 hour.
          </p>

          <div className="flex gap-1.5 mb-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handleCreate(p.amount)}
                disabled={creating}
                className="flex-[1] px-1.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500/50 transition-all text-center disabled:opacity-50 disabled:cursor-wait"
              >
                <div className="text-[11px] font-bold text-white">{p.label}</div>
                <div className="text-[9px] text-gray-400 font-mono mt-0.5">{p.amount}</div>
              </button>
            ))}
          </div>

          {creating && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-blue-400 mt-3 animate-pulse bg-blue-900/20 py-1.5 rounded-md">
              <Loader2 size={12} className="animate-spin" />
              Approve in Freighter...
            </div>
          )}

          {error && (
            <p className="text-[11px] text-red-400 mt-2 bg-red-900/20 p-1.5 rounded-md">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

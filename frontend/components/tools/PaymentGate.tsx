"use client";

import { useState, useEffect } from "react";
import { isConnected } from "@stellar/freighter-api";
import { PaymentReceipt, PaymentStatus, X402PaymentError } from "@/lib/stellar";
import { CheckCircle2, Loader2, AlertCircle, Zap } from "lucide-react";
import { getActiveSession } from "@/lib/session";

interface PaymentGateProps {
  price: string;
  buttonText: string;
  onAction: (updateStatus: (s: PaymentStatus) => void) => Promise<void | PaymentReceipt>;
  disabled?: boolean;
}

const STELLAR_EXPLORER_BASE_URL = "https://stellar.expert/explorer/testnet";

function getReceiptExplorerUrl(receipt: PaymentReceipt | null): string | undefined {
  if (!receipt) {
    return undefined;
  }

  if (receipt.txHash) {
    return `${STELLAR_EXPLORER_BASE_URL}/tx/${receipt.txHash}`;
  }

  return receipt.explorerUrl;
}

export function PaymentGate({ price, buttonText, onAction, disabled }: PaymentGateProps) {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<PaymentReceipt | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setHasSession(!!getActiveSession());
    const interval = setInterval(() => setHasSession(!!getActiveSession()), 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleClick() {
    if (!(await isConnected())) {
      alert("Please connect Freighter wallet first!");
      return;
    }

    try {
      setStatus("requesting");
      setErrorDetails(null);
      const receipt = await onAction(setStatus);
      setLastReceipt(receipt ?? null);
      setStatus("done");
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      if (e instanceof X402PaymentError && e.receipt) {
        setLastReceipt(e.receipt);
      } else {
        setLastReceipt(null);
      }
      setErrorDetails(e.message || "Payment failed, no charge applied");
    }
  }

  const isWorking = status !== "idle" && status !== "error" && status !== "done";
  const receiptExplorerUrl = getReceiptExplorerUrl(lastReceipt);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-gray-800 bg-black/40 rounded-xl mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-900/40 p-2 rounded-lg border border-blue-800/50">
             <span className="font-mono text-blue-400 font-bold">{price}</span>
             <span className="text-gray-400 text-sm ml-1">USDC</span>
          </div>
          {hasSession ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <Zap size={12} className="text-green-400" />
              <span className="text-xs text-green-400 font-mono font-bold">Session</span>
            </div>
          ) : (
            <div className="text-sm text-gray-400">
               Per execution
            </div>
          )}
        </div>
        
        <button
          onClick={handleClick}
          disabled={disabled || isWorking}
          className={`px-6 py-2.5 rounded-lg font-medium shadow-lg transition-all flex items-center gap-2
             ${isWorking ? "bg-blue-600 opacity-80 cursor-wait" : 
               status === "done" ? "bg-green-600" :
               status === "error" ? "bg-red-600" :
               "bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95"
             }
             ${disabled ? "opacity-50 cursor-not-allowed hover:scale-100 bg-gray-700" : ""}
          `}
        >
          {isWorking ? (
             <>
               <Loader2 size={18} className="animate-spin" />
               {status === "approving" && !hasSession && "Approve in Freighter..."}
               {status === "confirming" && !hasSession && "Confirming on chain..."}
               {status === "delivering" && "Generating..."}
               {status === "requesting" && (hasSession ? "Using session credit..." : "Requesting...")}
             </>
          ) : status === "done" ? (
             <>
                <CheckCircle2 size={18} />
                Generated!
             </>
          ) : status === "error" ? (
             <>
                <AlertCircle size={18} />
                Failed
             </>
          ) : (
            buttonText
          )}
        </button>
      </div>

      {status === "error" && (
         <div className="text-sm text-red-400 text-center animate-pulse">
            {errorDetails}
         </div>
      )}

      {status === "done" && receiptExplorerUrl && (
         <div className="text-sm text-green-400 text-center">
            Transaction successful.{" "}
            <a
              href={receiptExplorerUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-green-300"
            >
              View on Stellar Expert
            </a>
          </div>
      )}

      {status === "error" && receiptExplorerUrl && (
         <div className="text-sm text-red-400 text-center mt-2">
            Transaction failed on-chain.{" "}
            <a
              href={receiptExplorerUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-red-300"
            >
              View on Stellar Expert
            </a>
          </div>
      )}
    </div>
  );
}

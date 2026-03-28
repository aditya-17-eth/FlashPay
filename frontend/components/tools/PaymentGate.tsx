"use client";

import { useState } from "react";
import { isConnected } from "@stellar/freighter-api";
import { PaymentStatus } from "@/lib/stellar";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface PaymentGateProps {
  price: string;
  buttonText: string;
  onAction: (updateStatus: (s: PaymentStatus) => void) => Promise<void>;
  disabled?: boolean;
}

export function PaymentGate({ price, buttonText, onAction, disabled }: PaymentGateProps) {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  async function handleClick() {
    if (!(await isConnected())) {
      alert("Please connect Freighter wallet first!");
      return;
    }

    try {
      setStatus("requesting");
      setErrorDetails(null);
      await onAction(setStatus);
      setStatus("done");
      // Reset after a few sec
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setErrorDetails(e.message || "Payment failed, no charge applied");
      setTimeout(() => setStatus("idle"), 5000);
    }
  }

  const isWorking = status !== "idle" && status !== "error" && status !== "done";

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-gray-800 bg-black/40 rounded-xl mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-900/40 p-2 rounded-lg border border-blue-800/50">
             <span className="font-mono text-blue-400 font-bold">{price}</span>
             <span className="text-gray-400 text-sm ml-1">USDC</span>
          </div>
          <div className="text-sm text-gray-400">
             Per execution
          </div>
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
               {status === "approving" && "Approve in Freighter..."}
               {status === "confirming" && "Confirming on chain..."}
               {status === "delivering" && "Generating..."}
               {status === "requesting" && "Requesting..."}
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
    </div>
  );
}

"use client";

import { useState } from "react";
import { TOOL_PRICES } from "@/lib/prices";
import { PaymentGate } from "./PaymentGate";
import { x402Fetch, PaymentReceipt, PaymentStatus } from "@/lib/stellar";
import { Copy, SaveAll } from "lucide-react";

export function SummariseTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"summarise" | "rewrite" | "bullets">("summarise");
  const [result, setResult] = useState<string | null>(null);

  const handleAction = async (updateStatus: (s: PaymentStatus) => void): Promise<PaymentReceipt | undefined> => {
     if (text.length < 10) return;
     
     const response = await x402Fetch("/api/tools/summarise", { text, mode }, updateStatus);
     if (!response.ok) {
        throw new Error("Failed to summarise");
     }
     
     const data = await response.json();
     if (data.error) throw new Error(data.error);
     
     setResult(data.result);
     return response.x402Payment;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
       <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative group overflow-hidden">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here (min 10 chars)..."
            className="w-full h-48 bg-transparent text-lg focus:outline-none resize-none placeholder-gray-600 font-serif leading-relaxed"
            maxLength={10000}
          />
          <div className="flex items-center justify-between border-t border-gray-800 pt-4 mt-2">
            <div className="flex gap-2">
               {["summarise", "rewrite", "bullets"].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m as any)}
                    className={`px-3 py-1 text-sm rounded-full transition-all border ${
                       mode === m 
                       ? "bg-blue-600/20 border-blue-500 text-blue-400" 
                       : "border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700"
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
               ))}
            </div>
            <div className="text-xs text-gray-600">
               {text.length} / 10000
            </div>
          </div>
       </div>

       <PaymentGate
          price={TOOL_PRICES.summarise.toString()}
          buttonText="Run Tool"
          onAction={handleAction}
          disabled={text.length < 10}
       />

       {result && (
         <div className="bg-black border border-gray-800 rounded-2xl p-8 relative animate-in slide-in-from-bottom-4 duration-500 group">
            <button 
                onClick={() => navigator.clipboard.writeText(result)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors bg-gray-900/50 p-2 rounded-lg backdrop-blur-sm"
              >
                <Copy size={20} />
            </button>
            
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800 whitespace-pre-wrap font-serif text-lg text-gray-200">
              {result}
            </div>
         </div>
       )}
    </div>
  );
}

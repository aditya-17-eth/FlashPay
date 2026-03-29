"use client";

import { useState } from "react";
import { TOOL_PRICES } from "@/lib/prices";
import { PaymentGate } from "./PaymentGate";
import { x402Fetch, PaymentReceipt, PaymentStatus } from "@/lib/stellar";
import { Download, Share2 } from "lucide-react";

export function ImageTool() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleAction = async (
    updateStatus: (s: PaymentStatus) => void,
  ): Promise<PaymentReceipt | undefined> => {
    if (!prompt) return;

    setImageUrl(null);
    const response = await x402Fetch("/api/tools/image", { prompt }, updateStatus);
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Failed to fetch image");
    }

    setImageUrl(data.imageUrl);
    return response.x402Payment;
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative group overflow-hidden">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want..."
          className="w-full h-32 bg-transparent text-lg focus:outline-none resize-none placeholder-gray-600"
          maxLength={500}
        />
        <div className="absolute right-4 bottom-4 text-xs text-gray-600">
          {prompt.length} / 500
        </div>
      </div>

      <PaymentGate
        price={TOOL_PRICES.image.toString()}
        buttonText="Generate Image"
        onAction={handleAction}
        disabled={prompt.length < 3}
      />

      {imageUrl && (
        <div className="w-full sm:w-[90%] mx-auto rounded-2xl border border-gray-800 overflow-hidden relative shadow-2xl bg-black animate-in fade-in zoom-in duration-500">
          <img
            src={imageUrl}
            alt={prompt}
            className="w-full h-auto object-contain opacity-90 hover:opacity-100 transition duration-500"
          />

          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = imageUrl;
                a.download = "flashpay-image.jpg";
                a.click();
              }}
              className="bg-black/60 hover:bg-black p-2 rounded-full backdrop-blur transition-all border border-gray-700"
            >
              <Download size={20} className="text-white" />
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(imageUrl)}
              className="bg-black/60 hover:bg-black p-2 rounded-full backdrop-blur transition-all border border-gray-700"
            >
              <Share2 size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

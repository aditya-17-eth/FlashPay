"use client";

import { MessageSquare, ArrowRight, Image, FileText, Code } from "lucide-react";
import Link from "next/link";
import { TOOL_PRICES } from "@/lib/prices";

interface SuggestionCardProps {
  tool: "image" | "summarise" | "pdf" | "code";
  reason: string;
  inputHint: string;
}

const TOOL_MAP = {
  image: { icon: <Image className="text-pink-400" size={24} />, name: "Image Generator", path: "/tools/image" },
  summarise: { icon: <FileText className="text-yellow-400" size={24} />, name: "Summariser", path: "/tools/summarise" },
  pdf: { icon: <FileText className="text-red-400" size={24} />, name: "PDF Analyser", path: "/tools/pdf" },
  code: { icon: <Code className="text-blue-400" size={24} />, name: "Code Generator", path: "/tools/code" },
};

export function SuggestionCard({ tool, reason, inputHint }: SuggestionCardProps) {
  const meta = TOOL_MAP[tool];
  if (!meta) return null;

  return (
    <div className="my-4 border border-blue-500/30 bg-blue-900/10 p-4 rounded-2xl flex flex-col sm:flex-row shadow-lg sm:items-center justify-between gap-4 max-w-xl duration-300 hover:bg-blue-900/20 group">
       <div className="flex gap-4 items-center flex-1">
          <div className="bg-blue-950 p-3 rounded-xl border border-blue-900 shadow-inner group-hover:scale-110 transition-transform">
             {meta.icon}
          </div>
          <div>
             <h4 className="font-semibold text-white text-lg flex items-center gap-2">
                 {meta.name}
                 <span className="text-xs bg-blue-950/50 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20 font-mono">
                    {TOOL_PRICES[tool]} USDC
                 </span>
             </h4>
             <p className="text-sm text-gray-400 leading-snug break-balance">
                {reason} <span className="opacity-0 group-hover:opacity-100 transition inline whitespace-nowrap text-blue-400">({inputHint})</span>
             </p>
          </div>
       </div>
       <Link 
          href={meta.path}
          className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all px-5 py-2.5 rounded-xl font-medium shadow-xl shadow-blue-500/20"
       >
          Run this tool
          <ArrowRight className="group-hover:translate-x-1 duration-300" size={18} />
       </Link>
    </div>
  );
}

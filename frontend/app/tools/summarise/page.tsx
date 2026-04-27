import { SummariseTool } from "@/components/tools/SummariseTool";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SummarisePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl relative">
      <Link href="/" className="absolute top-8 left-4 md:left-0 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-900/50 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors w-fit border border-gray-800">
        <ArrowLeft size={16} /> Back
      </Link>
      <div className="mb-8 flex flex-col items-center text-center">
         <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-4 border border-yellow-500/20">
            <FileText size={32} className="text-yellow-400" />
         </div>
         <h1 className="text-4xl font-bold mb-2">Summariser</h1>
         <p className="text-gray-400">Digest, rewrite or format long forms of text with ease.</p>
      </div>
      <SummariseTool />
    </div>
  );
}

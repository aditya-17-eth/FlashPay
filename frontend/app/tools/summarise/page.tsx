import { SummariseTool } from "@/components/tools/SummariseTool";
import { FileText } from "lucide-react";

export default function SummarisePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
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

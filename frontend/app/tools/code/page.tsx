import { CodeTool } from "@/components/tools/CodeTool";
import { Code } from "lucide-react";

export default function CodePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex flex-col items-center text-center">
         <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
            <Code size={32} className="text-blue-400" />
         </div>
         <h1 className="text-4xl font-bold mb-2">Code Generator</h1>
         <p className="text-gray-400">Ship faster by writing robust boilerplate via plain English.</p>
      </div>
      <CodeTool />
    </div>
  );
}

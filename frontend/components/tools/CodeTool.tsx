"use client";

import { useState } from "react";
import { TOOL_PRICES } from "@/lib/prices";
import { PaymentGate } from "./PaymentGate";
import { PaymentStatus, x402Fetch } from "@/lib/stellar";
import { Code, Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export function CodeTool() {
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAction = async (updateStatus: (s: PaymentStatus) => void) => {
     if (description.length < 10) return;
     
     const response = await x402Fetch("/api/tools/code", { description, language }, updateStatus);
     if (!response.ok) {
        throw new Error("Failed to generate code");
     }
     
     const data = await response.json();
     if (data.error) throw new Error(data.error);
     
     // Extract code block from ```lang ... ``` if present
     let codeResult = data.result;
     const match = codeResult.match(/```[a-z]*\n([\s\S]*?)```/);
     if (match) {
        codeResult = match[1].trim();
     }
     
     setResult(codeResult);
  };

  const copyCode = () => {
      navigator.clipboard.writeText(result || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
       <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative group overflow-hidden">
          <div className="flex gap-4 mb-4 items-center">
             <Code className="text-blue-500" />
             <select 
               value={language}
               onChange={(e) => setLanguage(e.target.value)}
               className="bg-black border border-gray-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
             >
                 <option value="typescript">TypeScript</option>
                 <option value="javascript">JavaScript</option>
                 <option value="python">Python</option>
                 <option value="rust">Rust</option>
                 <option value="solidity">Solidity</option>
                 <option value="go">Go</option>
                 <option value="other">Other</option>
             </select>
          </div>
          
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what code you need... (e.g. A React hook for debouncing a value)"
            className="w-full h-32 bg-transparent text-lg focus:outline-none resize-none placeholder-gray-600 font-sans"
            maxLength={1000}
          />
          <div className="absolute right-4 bottom-4 text-xs text-gray-600">
             {description.length} / 1000
          </div>
       </div>

       <PaymentGate
          price={TOOL_PRICES.code.toString()}
          buttonText="Generate Code"
          onAction={handleAction}
          disabled={description.length < 10}
       />

       {result && (
         <div className="rounded-xl border border-gray-800 overflow-hidden relative shadow-2xl animate-in slide-in-from-top-2 duration-500">
            <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex justify-between items-center text-sm font-mono text-gray-400">
               <span>{language}</span>
               <button onClick={copyCode} className="hover:text-white transition flex gap-1 items-center">
                   {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                   {copied ? "Copied" : "Copy"}
               </button>
            </div>
            
            <SyntaxHighlighter
              language={language === "other" ? "text" : language}
              style={vscDarkPlus}
              customStyle={{ margin: 0, padding: "1.5rem", fontSize: "0.95rem" }}
              showLineNumbers
            >
              {result}
            </SyntaxHighlighter>
         </div>
       )}
    </div>
  );
}

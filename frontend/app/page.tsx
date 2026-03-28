import Link from "next/link";
import { ArrowRight, Image, FileText, Code, CheckCircle2 } from "lucide-react";
import { TOOL_PRICES } from "@/lib/prices";

// Static color map — Tailwind JIT can only detect full static class names
const colorMap = {
  pink: {
    glow: "bg-pink-500/10",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    text: "text-pink-400",
  },
  yellow: {
    glow: "bg-yellow-500/10",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
  },
  red: {
    glow: "bg-red-500/10",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
  },
  blue: {
    glow: "bg-blue-500/10",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
  },
} as const;

type ColorKey = keyof typeof colorMap;

export default function Home() {
  const tools = [
    { name: "Image Generator", icon: Image, href: "/tools/image", color: "pink" as ColorKey, price: TOOL_PRICES.image, desc: "Text to image via Pollinations.ai" },
    { name: "Summariser", icon: FileText, href: "/tools/summarise", color: "yellow" as ColorKey, price: TOOL_PRICES.summarise, desc: "Digest long forms of text" },
    { name: "PDF Analyser", icon: FileText, href: "/tools/pdf", color: "red" as ColorKey, price: TOOL_PRICES.pdf, desc: "QA and summarise large PDFs" },
    { name: "Code Generator", icon: Code, href: "/tools/code", color: "blue" as ColorKey, price: TOOL_PRICES.code, desc: "Plain English to code" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 py-20 flex flex-col items-center justify-center text-center">
         <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
         
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Live on Stellar Testnet
         </div>

         <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
            AI tools. Pay per use.<br />No subscription.
         </h1>
         
         <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            FlashPay is an open-source x402 payment protocol layer over Stellar Soroban. Connect your Freighter wallet and pay a fraction of a cent per execution.
         </p>

         <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/tools/image" 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
               Get Started <ArrowRight size={20} />
            </Link>
            <Link 
              href="/assistant" 
              className="px-8 py-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
            >
               Talk to free Assistant
            </Link>
         </div>
      </section>

      {/* Tools Grid */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full">
         <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose your tool</h2>
            <p className="text-gray-400">Execute on-demand logic powered by Llama 3.3. Settled via USDC.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((t) => {
               const Icon = t.icon;
               const colors = colorMap[t.color];
               return (
                  <Link 
                    key={t.name}
                    href={t.href}
                    className="group bg-gray-900/50 border border-gray-800 hover:border-gray-700 hover:bg-gray-900 p-6 rounded-3xl transition-all hover:-translate-y-1 block relative overflow-hidden"
                  >
                     <div className={`absolute -right-4 -top-4 w-24 h-24 ${colors.glow} rounded-full blur-2xl group-hover:scale-150 transition-transform`} />
                     <div className={`w-12 h-12 ${colors.bg} ${colors.border} border rounded-xl flex items-center justify-center mb-6`}>
                        <Icon size={24} className={colors.text} />
                     </div>
                     <h3 className="text-xl font-bold mb-2">{t.name}</h3>
                     <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-gray-800">{t.desc}</p>
                     <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{t.price} USDC</span>
                        <ArrowRight size={18} className="text-gray-600 group-hover:translate-x-1 group-hover:text-white transition-all" />
                     </div>
                  </Link>
               );
            })}
         </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 max-w-5xl mx-auto w-full border-t border-gray-900 mt-auto">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center font-mono text-xl text-gray-400 border border-gray-800 mb-6 font-bold shadow-lg shadow-black">1</div>
                 <h3 className="text-lg font-bold mb-2">Connect Wallet</h3>
                 <p className="text-sm text-gray-400 leading-relaxed">Install Freighter and fund it with testnet XLM and USDC via the Stellar laboratory.</p>
             </div>
             <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center font-mono text-xl text-gray-400 border border-gray-800 mb-6 font-bold shadow-lg shadow-black">2</div>
                 <h3 className="text-lg font-bold mb-2">Use a Tool</h3>
                 <p className="text-sm text-gray-400 leading-relaxed">Type your prompt or upload a document. The server returns a 402 HTTP Payment Required.</p>
             </div>
             <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl text-white border border-blue-500 mb-6 font-bold shadow-lg shadow-blue-500/20">
                     <CheckCircle2 size={24} />
                 </div>
                 <h3 className="text-lg font-bold mb-2">Instant Settlement</h3>
                 <p className="text-sm text-gray-400 leading-relaxed">Approve the micro-payment. The Soroban contract locks the funds until API delivery.</p>
             </div>
         </div>
      </section>
    </div>
  );
}

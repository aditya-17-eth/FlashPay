"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Zap, Hash } from "lucide-react";
import { SuggestionCard } from "./SuggestionCard";

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([{
     role: "assistant",
     content: "Hi! I'm FlashPay's AI assistant. I can help you decide which tool to use, answer questions, or just chat. I'm completely free — tools cost a tiny USDC fee but talking to me is always **free**."
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const newMsgs = [...messages, { role: "user" as Role, content: input }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs })
      });

      const data = await res.json();
      if (data.result) {
        setMessages([...newMsgs, { role: "assistant", content: data.result }]);
      }
    } catch(e) {
      setMessages([...newMsgs, { role: "assistant", content: "Sorry, I ran into an issue connecting to the network." }]);
    }
    setLoading(false);
  };

  const renderMessageContent = (content: string) => {
    // Check for TOOL_SUGGESTION
    const toolRegex = /TOOL_SUGGESTION:\s*(\{.*\})/;
    const match = content.match(toolRegex);
    
    let text = content;
    let suggestion = null;
    
    if (match) {
        try {
            suggestion = JSON.parse(match[1]);
            text = content.replace(match[0], "").trim();
        } catch { /* malformed suggestion */ }
    }

    return (
      <div className="flex flex-col gap-2">
         <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-blue-400 prose-pre:bg-black whitespace-pre-wrap">
             {text}
         </div>
         {suggestion && <SuggestionCard {...suggestion} />}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto border border-gray-800 rounded-3xl overflow-hidden shadow-2xl bg-black/50">
       <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold flex gap-2 items-center">
            <Zap className="text-yellow-500" />
            FlashPay Assistant
          </h2>
          <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono tracking-widest uppercase">
            Free to use
          </span>
       </div>

       <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 scroll-smooth pb-8 relative">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
          
          {messages.map((msg, i) => (
             <div key={i} className={`flex gap-4 max-w-3xl ${msg.role === "user" ? "ml-auto" : ""}`}>
                {msg.role === "assistant" && (
                   <div className="w-10 h-10 shrink-0 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Zap size={20} className="text-white" />
                   </div>
                )}
                <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : ""}`}>
                   <span className="text-xs text-gray-500 px-2 font-medium tracking-wide uppercase">
                       {msg.role === "user" ? "You" : "FlashPay"}
                   </span>
                   <div className={`p-4 rounded-3xl ${
                      msg.role === "user" 
                      ? "bg-blue-600 rounded-tr-none text-white shadow-xl shadow-blue-600/10" 
                      : "bg-gray-900 border border-gray-800 rounded-tl-none shadow-xl"
                   }`}>
                      {renderMessageContent(msg.content)}
                   </div>
                </div>
             </div>
          ))}
          {loading && (
             <div className="flex gap-4 items-center">
                <div className="w-10 h-10 shrink-0 bg-blue-600/50 animate-pulse rounded-full flex items-center justify-center pointer-events-none border border-blue-500/30">
                     <Zap size={20} className="text-blue-300" />
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-3xl rounded-tl-none px-6 py-5 flex gap-2 items-center shadow-lg">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
             </div>
          )}
       </div>

       <div className="p-4 bg-gray-950 border-t border-gray-800">
          <div className="flex max-w-4xl mx-auto items-center gap-2 bg-black border border-gray-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-2xl p-2 pr-6 shadow-inner transition-all group overflow-hidden">
             
             <textarea 
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSend();
                  }
               }}
               placeholder="Chat with the assistant to discover logic..."
               className="flex-1 bg-transparent px-4 py-3 focus:outline-none resize-none max-h-32 text-gray-100 placeholder-gray-600 text-lg leading-relaxed"
               rows={1}
               disabled={loading}
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim() || loading}
               className="h-12 w-12 shrink-0 bg-blue-600 hover:bg-blue-500 hover:scale-110 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 group-focus-within:bg-blue-500"
             >
               <Send size={20} className="mr-1 mt-1" />
             </button>
          </div>
       </div>
    </div>
  );
}

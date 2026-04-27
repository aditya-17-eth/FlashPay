"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./WalletConnect";
import { Zap, MessageSquare, Image, FileText, Code, PieChart, Info, Menu, X, ChevronDown, Wrench } from "lucide-react";

const tools = [
  { href: "/tools/image", label: "Image Tool", icon: Image, description: "Generate images with FLUX.1" },
  { href: "/tools/summarise", label: "Summarise", icon: FileText, description: "Quickly summarise text" },
  { href: "/tools/pdf", label: "PDF Analyser", icon: FileText, description: "Extract insights from PDFs" },
  { href: "/tools/code", label: "Code Gen", icon: Code, description: "Generate high-quality code" },
];

const mainNav = [
  { href: "/assistant", label: "Assistant", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: PieChart },
  { href: "/about", label: "About", icon: Info },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/70 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Zap className="text-yellow-500 fill-yellow-500" />
            <span>Flash<span className="text-blue-500">Pay</span></span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="relative group" onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)}>
            <button className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname.startsWith("/tools") ? "text-white" : "text-gray-400 hover:text-white"
            }`}>
              <Wrench size={16} />
              <span>Tools</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Mega Menu Dropdown */}
            <div className={`absolute top-full left-1/2 -translate-x-[20%] w-[420px] pt-4 transition-all duration-200 ${
              toolsOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
            }`}>
              <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-4 grid grid-cols-2 gap-2">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = pathname === tool.href;
                  return (
                    <Link 
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setToolsOpen(false)}
                      className={`flex flex-col gap-1 p-3 rounded-lg transition-colors ${
                        isActive ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-gray-800 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={isActive ? "text-blue-400" : "text-gray-400"} />
                        <span className={`text-sm font-medium ${isActive ? "text-blue-400" : "text-white"}`}>{tool.label}</span>
                      </div>
                      <span className="text-xs text-gray-500">{tool.description}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isAct = pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                     isAct ? "bg-white/10 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon size={16} className={isAct ? "text-blue-400" : ""} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <WalletConnect />
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-800 bg-gray-950 px-4 py-6 flex flex-col gap-6">
          <div className="sm:hidden flex justify-center pb-4 border-b border-gray-800">
            <WalletConnect />
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Tools</div>
            <div className="grid grid-cols-2 gap-2">
              {tools.map((item) => {
                const Icon = item.icon;
                const isAct = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                       isAct ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-gray-900 border border-gray-800 text-gray-300"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Platform</div>
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isAct = pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                     isAct ? "bg-white/10 text-white" : "text-gray-400 hover:bg-gray-900"
                  }`}
                >
                  <Icon size={18} className={isAct ? "text-blue-400" : ""} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  );
}

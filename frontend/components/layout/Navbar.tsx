"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./WalletConnect";
import { Zap, MessageSquare, Image, FileText, Code, PieChart, Info } from "lucide-react";

const navItems = [
  { href: "/tools/image", label: "Image", icon: Image },
  { href: "/tools/summarise", label: "Summarise", icon: FileText },
  { href: "/tools/pdf", label: "PDF", icon: FileText },
  { href: "/tools/code", label: "Code", icon: Code },
  { href: "/assistant", label: "Assistant", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: PieChart },
  { href: "/about", label: "About", icon: Info },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Zap className="text-yellow-500 fill-yellow-500" />
          <span>Flash<span className="text-blue-500">Pay</span></span>
        </Link>
        
        <div className="hidden md:flex flex-1 mx-8 border border-gray-800 rounded-full bg-black/40 px-3 py-1 items-center justify-evenly">
          {navItems.map((item) => {
             const Icon = item.icon;
             const isAct = pathname.startsWith(item.href);
             return (
               <Link 
                 key={item.href} 
                 href={item.href}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isAct ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                 }`}
               >
                 <Icon size={16} className={isAct ? "text-blue-400" : ""} />
                 <span className={isAct ? "block" : "hidden lg:block"}>{item.label}</span>
               </Link>
             )
          })}
        </div>

        <WalletConnect />
      </div>
    </nav>
  );
}

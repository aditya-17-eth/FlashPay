import Link from "next/link";
import { Zap, Github, Twitter, Disc as Discord, Shield, Code, FileText, Image, MessageSquare } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-black pt-16 pb-8 mt-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand & Description */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold mb-4">
              <Zap className="text-yellow-500 fill-yellow-500" />
              <span>Flash<span className="text-blue-500">Pay</span></span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              AI tools for everyone — no subscription, no account, just your wallet and a fraction of a cent per task, settled instantly on Stellar via the x402 protocol.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com/aditya-17-eth/FlashPay" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-gray-500 hover:text-blue-400 transition-colors">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-gray-500 hover:text-indigo-400 transition-colors">
                <Discord size={20} />
                <span className="sr-only">Discord</span>
              </a>
            </div>
          </div>

          {/* AI Tools */}
          <div>
            <h3 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">AI Tools</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/tools/image" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 text-sm">
                  <Image size={14} className="text-gray-500" /> 
                  Image Generator
                </Link>
              </li>
              <li>
                <Link href="/tools/summarise" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 text-sm">
                  <FileText size={14} className="text-gray-500" /> 
                  Text Summariser
                </Link>
              </li>
              <li>
                <Link href="/tools/pdf" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 text-sm">
                  <FileText size={14} className="text-gray-500" /> 
                  PDF Analyser
                </Link>
              </li>
              <li>
                <Link href="/tools/code" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 text-sm">
                  <Code size={14} className="text-gray-500" /> 
                  Code Generator
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Platform</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/assistant" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 text-sm">
                  <MessageSquare size={14} className="text-gray-500" />
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <a href="https://github.com/aditya-17-eth/FlashPay" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div>
            <h3 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Legal & Security</h3>
            <ul className="space-y-4">
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 text-sm">
                  <Shield size={14} className="text-green-500/70" /> 
                  Security Trustless Escrow
                </Link>
              </li>
              <li>
                <a href="https://github.com/aditya-17-eth/FlashPay/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">
                  MIT License
                </a>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} FlashPay. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Powered by 
            <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors font-medium">
              Stellar
            </a>
            &
            <a href="https://groq.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors font-medium">
              Groq
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

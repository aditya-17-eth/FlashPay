import React from "react";
import { Shield, Zap, FileCode2, Wallet } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="mb-16 text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          About <span className="text-blue-500">FlashPay</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          AI tools for everyone — no subscription, no account, just your wallet and a fraction of a cent per task, settled instantly on Stellar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl hover:bg-gray-900 transition-colors">
          <div className="bg-blue-500/20 p-3 w-14 h-14 rounded-full flex items-center justify-center mb-6">
            <Zap className="text-blue-400" size={28} />
          </div>
          <h3 className="text-3xl font-semibold mb-3">x402 Protocol</h3>
          <p className="text-gray-400 leading-relaxed">
            FlashPay implements the x402 HTTP payment protocol open-sourced by Coinbase. Instead of requiring credit cards and accounts, our backend returns an HTTP 402 Payment Required code, which is transparently intercepted and managed through your Freighter wallet. Pay only for exactly what you use.
          </p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl hover:bg-gray-900 transition-colors">
          <div className="bg-green-500/20 p-3 w-14 h-14 rounded-full flex items-center justify-center mb-6">
            <Shield className="text-green-400" size={28} />
          </div>
          <h3 className="text-3xl font-semibold mb-3">Trustless Escrow</h3>
          <p className="text-gray-400 leading-relaxed">
            Payments are governed by a Soroban smart contract on the Stellar network. When you authorize a payment, USDC is temporarily locked. If the AI tool fails or produces an error, you receive an instant and entirely automated refund. You never pay for failed requests.
          </p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl hover:bg-gray-900 transition-colors">
          <div className="bg-purple-500/20 p-3 w-14 h-14 rounded-full flex items-center justify-center mb-6">
            <FileCode2 className="text-purple-400" size={28} />
          </div>
          <h3 className="text-3xl font-semibold mb-3">Advanced Features</h3>
          <p className="text-gray-400 leading-relaxed">
            FlashPay goes beyond basic micropayments by featuring Account Abstraction via Smart Sessions. You can allocate a set budget for a session, and use AI tools directly without repetitive wallet popups. It is zero-friction AI right at your fingertips.
          </p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl hover:bg-gray-900 transition-colors">
          <div className="bg-yellow-500/20 p-3 w-14 h-14 rounded-full flex items-center justify-center mb-6">
            <Wallet className="text-yellow-400" size={28} />
          </div>
          <h3 className="text-3xl font-semibold mb-3">Seamless Access</h3>
          <p className="text-gray-400 leading-relaxed">
            We provide five distinct tools: a FLUX.1 Image Generator, PDF Analyser, Code Generator, Text Summariser, and a Free AI Assistant perfectly stitched together. Built with Next.js, Groq backend, and Stellar integration.
          </p>
        </div>
      </div>

      <div className="relative border border-gray-800 bg-black overflow-hidden rounded-3xl p-10 md:p-14 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none" />
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to try it out?</h2>
        <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto">
          Connect your Freighter wallet on the testnet and experience the future of pay-per-use internet software.
        </p>
        <a href="/tools/image" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold transition-transform hover:scale-105">
          <Zap size={20} fill="currentColor" /> Let's Start
        </a>
      </div>
    </div>
  );
}

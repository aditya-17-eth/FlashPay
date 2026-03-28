"use client";

import { useEffect, useState } from "react";
import {
  isAllowed,
  requestAccess,
  getAddress,
  isConnected,
} from "@stellar/freighter-api";
import { Wallet } from "lucide-react";

/** Helper to wrap promises with a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);
}

export function WalletConnect() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initCheck() {
      // Small initial delay so extension has time to inject its message listener
      await new Promise((r) => setTimeout(r, 200));
      if (!mounted) return;

      try {
        // Quick short timeout for initial connection check so we don't hang if they don't have it
        const isConnResult = (await withTimeout(isConnected() as any, 1000)) as any;
        const connected = isConnResult === true || isConnResult?.isConnected === true;

        if (connected) {
          const authStatus = (await withTimeout(isAllowed() as any, 1000)) as any;
          const allowed = authStatus === true || authStatus?.isAllowed === true;

          if (allowed) {
            const addrResult = (await withTimeout(getAddress() as any, 1000)) as any;
            const address = typeof addrResult === 'string' ? addrResult : addrResult?.address;

            if (address) {
              setWallet(address);
              registerUser(address).catch(() => {});
            }
          }
        }
      } catch (e) {
         // Silently fail if Freighter hangs or is missing
      }
      
      if (mounted) setLoading(false);
    }

    initCheck();
    return () => { mounted = false; };
  }, []);

  async function connect() {
    setLoading(true);
    try {
      // When connecting manually, give a bit longer timeout (2000ms) for the extension to wake up
      let connected = false;
      try {
        const isConnResult = (await withTimeout(isConnected() as any, 2000)) as any;
        connected = isConnResult === true || isConnResult?.isConnected === true;
      } catch (e) {
        // timeout
      }

      if (!connected) {
         alert("Freighter extension is not installed or detected! Please install Freighter and refresh.");
         setLoading(false);
         return;
      }

      // No timeout for requestAccess since the user has to click the popup
      const accessResult = await requestAccess() as any;
      const address = typeof accessResult === 'string' ? accessResult : accessResult?.address;
      
      if (address) {
        setWallet(address);
        registerUser(address).catch(() => {});
      } else if (accessResult?.error) {
        alert(`Freighter Connection Failed: ${accessResult.error}`);
      } else {
        alert("Freighter did not return an address. Make sure you are logged in.");
      }
    } catch (e: any) {
      alert(`Wallet Connection Error: ${e.message || String(e)}`);
      console.error(e);
    }
    setLoading(false);
  }

  function disconnect() {
    setWallet(null);
  }

  async function registerUser(pubKey: string) {
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: pubKey }),
      });
    } catch {
      // Ignore
    }
  }

  if (loading) {
    return <button className="animate-pulse h-10 w-36 bg-gray-800 rounded-lg" />;
  }

  if (!wallet) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg font-medium text-sm hover:opacity-90 transition shadow-lg shadow-blue-600/20"
      >
        <Wallet size={16} />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg cursor-pointer hover:border-gray-700 transition">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-mono text-sm text-gray-300">
          {wallet.substring(0, 4)}...{wallet.substring(52)}
        </span>
      </div>
      <button
        onClick={disconnect}
        className="absolute top-full right-0 mt-1 w-full px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-400 hover:text-white hover:border-gray-700 transition opacity-0 group-hover:opacity-100"
      >
        Disconnect
      </button>
    </div>
  );
}

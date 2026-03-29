"use client";

import { useEffect, useState } from "react";
import { getTestnetUSDC, getUSDCBalance } from "@/lib/faucet";
import { signTransaction } from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";

type FaucetStatus = "idle" | "building" | "signing" | "submitting" | "done" | "error";

interface USDCFaucetProps {
  userPublicKey: string;
  onSuccess: () => void;
}

function formatFaucetError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Failed to get testnet USDC";

  const normalized = message.toLowerCase();

  if (
    normalized.includes("user declined") ||
    normalized.includes("rejected") ||
    normalized.includes("cancelled")
  ) {
    return "Transaction cancelled";
  }

  return message;
}

export function USDCFaucet({ userPublicKey, onSuccess }: USDCFaucetProps) {
  const [status, setStatus] = useState<FaucetStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkBalance() {
      const balance = await getUSDCBalance(userPublicKey);
      if (!mounted) return;

      setVisible(Number(balance) <= 0.01);
    }

    checkBalance();
    return () => {
      mounted = false;
    };
  }, [userPublicKey]);

  if (!visible) {
    return null;
  }

  async function handleClick(sendMax = "10") {
    try {
      setErrorMessage("");
      setStatus("building");

      let xdr = await getTestnetUSDC(userPublicKey);

      if (sendMax === "20") {
        xdr = xdr.replace("AAAAAAo=", "AAAAABQ=");
      }

      setStatus("signing");
      const signResult = await signTransaction(xdr, {
        network: "TESTNET",
        networkPassphrase: Networks.TESTNET,
      });

      if (signResult.error) {
        setStatus("idle");
        setErrorMessage("Transaction cancelled");
        return;
      }

      setStatus("submitting");
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signedXDR: signResult.signedTxXdr }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        const message = data.error || "Failed to submit faucet transaction";

        if (
          sendMax === "10" &&
          typeof message === "string" &&
          message.toLowerCase().includes("path")
        ) {
          setStatus("error");
          setErrorMessage("Retrying with higher slippage...");
          await handleClick("20");
          return;
        }

        throw new Error(message);
      }

      setStatus("done");
      setTimeout(async () => {
        const balance = await getUSDCBalance(userPublicKey);
        setVisible(Number(balance) <= 0.01);
        onSuccess();
      }, 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(formatFaucetError(error));
    }
  }

  const buttonLabel =
    status === "building"
      ? "Building transaction..."
      : status === "signing"
        ? "Approve in Freighter..."
        : status === "submitting"
          ? "Submitting to Stellar..."
          : status === "done"
            ? "USDC added to wallet!"
            : "Get testnet USDC (swap 10 XLM → 1 USDC)";

  return (
    <div className="mt-4 w-full max-w-md rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
      {status === "error" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-400">{errorMessage}</p>
          <button
            onClick={() => handleClick()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Retry get testnet USDC
          </button>
        </div>
      ) : (
        <button
          onClick={() => handleClick()}
          disabled={status !== "idle"}
          className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-white transition ${
            status === "idle"
              ? "bg-blue-600 hover:bg-blue-500"
              : "cursor-wait bg-blue-600/70"
          }`}
        >
          {buttonLabel}
        </button>
      )}

      <p className="mt-3 text-xs text-blue-100/80">
        Free on testnet - costs ~10 XLM from your Friendbot balance
      </p>
    </div>
  );
}

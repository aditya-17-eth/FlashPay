"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { TOOL_PRICES } from "@/lib/prices";
import { PaymentGate } from "./PaymentGate";
import { PaymentReceipt, PaymentStatus, X402PaymentError } from "@/lib/stellar";
import { FileUp, File, Copy, X } from "lucide-react";
import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  Contract,
  nativeToScVal,
  Address,
} from "@stellar/stellar-sdk";
import { requestAccess, signTransaction } from "@stellar/freighter-api";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL!;
const CONTRACT_ID = process.env.NEXT_PUBLIC_FLASHPAY_CONTRACT_ID!;
const STELLAR_EXPLORER_TX_BASE_URL = "https://stellar.expert/explorer/testnet/tx";

function normalizePdfPaymentError(error: unknown, receipt?: PaymentReceipt): X402PaymentError {
  if (error instanceof X402PaymentError) {
    return error;
  }

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "PDF analysis failed";

  const normalizedMessage = rawMessage.toLowerCase();

  if (
    normalizedMessage.includes("trustline entry is missing") ||
    (normalizedMessage.includes("missing for account") &&
      normalizedMessage.includes("transfer"))
  ) {
    return new X402PaymentError(
      "This wallet is missing a USDC trustline on Stellar testnet. Add the USDC trustline and fund the wallet with testnet USDC, then try again.",
      receipt,
    );
  }

  if (
    normalizedMessage.includes("user declined") ||
    normalizedMessage.includes("rejected") ||
    normalizedMessage.includes("cancelled")
  ) {
    return new X402PaymentError("Payment approval was cancelled in Freighter.", receipt);
  }

  return new X402PaymentError(rawMessage, receipt);
}

async function getWalletAddress(): Promise<string> {
  const result = await requestAccess();
  if (!result.address) {
    throw new Error(`No wallet address from Freighter. ${result.error || ""}`);
  }
  return result.address;
}

async function lockPdfPayment(
  walletAddress: string,
  amount: string,
  nonce: number,
): Promise<PaymentReceipt> {
  const receipt: PaymentReceipt = {
    nonce,
    status: "success",
    tool: "pdf",
    walletAddress,
  };

  try {
    const server = new SorobanRpc.Server(RPC_URL);
    const account = await server.getAccount(walletAddress);

    const tx = new TransactionBuilder(account, {
      fee: "200",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        new Contract(CONTRACT_ID).call(
          "lock_payment",
          new Address(walletAddress).toScVal(),
          nativeToScVal(Math.round(parseFloat(amount) * 1e7), { type: "i128" }),
          nativeToScVal(nonce, { type: "u64" }),
          nativeToScVal("pdf", { type: "string" }),
        ),
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    const signResult = await signTransaction(prepared.toXDR(), {
      networkPassphrase: Networks.TESTNET,
    });

    if (signResult.error) {
      throw new X402PaymentError(signResult.error, receipt);
    }

    const submission = await server.sendTransaction(
      TransactionBuilder.fromXDR(signResult.signedTxXdr, Networks.TESTNET),
    );

    if (submission.hash) {
      receipt.txHash = submission.hash;
      receipt.explorerUrl = `${STELLAR_EXPLORER_TX_BASE_URL}/${submission.hash}`;
    }

    if (submission.status === "ERROR") {
      receipt.status = "failed";
      throw new X402PaymentError(
        typeof submission.errorResult === "string" && submission.errorResult
          ? submission.errorResult
          : "Transaction failed",
        receipt,
      );
    }

    return receipt;
  } catch (error) {
    if (receipt.txHash) {
      receipt.status = "failed";
    }
    throw normalizePdfPaymentError(error, receipt);
  }
}

export function PDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const executePayment = async (
    updateStatus: (s: PaymentStatus) => void,
  ): Promise<PaymentReceipt | undefined> => {
    if (!file) {
      return;
    }

    try {
      updateStatus("requesting");
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);
      if (question.trim()) {
        formData.append("question", question.trim());
      }

      const initRes = await fetch("/api/tools/pdf", {
        method: "POST",
        body: formData,
      });

      if (initRes.status !== 402) {
        const initData = await initRes.json();
        if (!initRes.ok || initData.error) {
          throw new Error(initData.error || "Failed to analyse PDF");
        }
        setResult(initData.result);
        return;
      }

      updateStatus("approving");
      const payment = await initRes.json();
      const walletAddress = await getWalletAddress();
      const receipt = await lockPdfPayment(walletAddress, payment.amount, payment.nonce);

      updateStatus("confirming");
      await new Promise((resolve) => setTimeout(resolve, 6000));

      updateStatus("delivering");
      const finalFormData = new FormData();
      finalFormData.append("file", file);
      if (question.trim()) {
        finalFormData.append("question", question.trim());
      }

      const finalRes = await fetch("/api/tools/pdf", {
        method: "POST",
        body: finalFormData,
        headers: {
          "x-payment-nonce": payment.nonce.toString(),
          "x-payer-address": walletAddress,
        },
      });

      const data = await finalRes.json();
      if (!finalRes.ok || data.error) {
        throw new Error(data.error || "Failed to analyse PDF");
      }

      setResult(data.result);
      return receipt;
    } catch (error) {
      throw normalizePdfPaymentError(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          isDragActive
            ? "border-blue-500 bg-blue-900/20"
            : "border-gray-800 bg-gray-900/50 hover:bg-gray-900"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 text-gray-400 font-medium">
          <FileUp
            size={48}
            className={isDragActive ? "text-blue-400" : "text-gray-600"}
          />
          {file ? (
            <div className="flex items-center gap-3 bg-black/50 px-6 py-3 rounded-xl border border-gray-800 w-full max-w-sm">
              <File size={24} className="text-blue-400 shrink-0" />
              <div className="flex flex-col items-start truncate overflow-hidden">
                <span className="text-white truncate w-full">{file.name}</span>
                <span className="text-xs font-mono">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="ml-auto p-1 text-gray-600 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p>Drag & drop a PDF here, or click to browse</p>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 relative group">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a specific question... (or leave blank for summary)"
          className="w-full bg-transparent text-lg focus:outline-none placeholder-gray-600"
          maxLength={500}
        />
      </div>
      <p className="text-xs text-gray-500 text-center px-4 -mt-2">
        FlashPay respects privacy. Documents are processed in-memory and instantly destroyed. We never save your PDF.
      </p>

      <PaymentGate
        price={TOOL_PRICES.pdf.toString()}
        buttonText="Analyse PDF"
        onAction={executePayment}
        disabled={!file}
      />

      {result && (
        <div className="bg-black border border-gray-800 rounded-xl p-8 relative animate-in zoom-in-95 duration-500">
          <button
            onClick={() => navigator.clipboard.writeText(result)}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <Copy size={20} />
          </button>
          <div className="prose prose-invert max-w-none text-lg leading-relaxed text-gray-300">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}

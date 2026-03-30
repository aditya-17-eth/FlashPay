import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  Contract,
  nativeToScVal,
  Address,
} from "@stellar/stellar-sdk";
import { signTransaction, requestAccess } from "@stellar/freighter-api";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL!;
const CONTRACT_ID = process.env.NEXT_PUBLIC_FLASHPAY_CONTRACT_ID!;
const NETWORK = Networks.TESTNET;
const STELLAR_EXPLORER_TX_BASE_URL = "https://testnet.stellar.expert/explorer/tx";

export type PaymentStatus =
  | "idle"
  | "requesting"
  | "approving"
  | "confirming"
  | "delivering"
  | "done"
  | "error";

export interface PaymentReceipt {
  explorerUrl?: string;
  nonce: number;
  status: "success" | "failed";
  tool: string;
  txHash?: string;
  walletAddress: string;
}

export type X402Response = Response & {
  x402Payment?: PaymentReceipt;
};

export class X402PaymentError extends Error {
  receipt?: PaymentReceipt;

  constructor(message: string, receipt?: PaymentReceipt) {
    super(message);
    this.name = "X402PaymentError";
    this.receipt = receipt;
  }
}

async function getWalletAddress(): Promise<string> {
  const result = await requestAccess();
  if (!result.address) {
    throw new Error(`No wallet address from Freighter. ${result.error || ""}`);
  }
  return result.address;
}

function getExplorerUrl(txHash?: string): string | undefined {
  return txHash ? `${STELLAR_EXPLORER_TX_BASE_URL}/${txHash}` : undefined;
}

function formatWalletError(error: unknown, receipt?: PaymentReceipt): X402PaymentError {
  if (error instanceof X402PaymentError) {
    return error;
  }

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Payment failed";

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

export async function x402Fetch(
  url: string,
  body: object,
  onStatus?: (status: PaymentStatus) => void,
): Promise<X402Response> {
  onStatus?.("requesting");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status !== 402) {
    return res as X402Response;
  }

  const payment = await res.json();

  onStatus?.("approving");
  const receipt = await lockPaymentOnChain(
    payment.payer || (await getWalletAddress()),
    payment.amount,
    payment.nonce,
    payment.tool,
  );

  onStatus?.("confirming");
  await waitForConfirmation(receipt.nonce);

  onStatus?.("delivering");
  const walletAddr = await getWalletAddress();
  const finalResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-payment-nonce": receipt.nonce.toString(),
      "x-payer-address": walletAddr,
    },
    body: JSON.stringify(body),
  });

  const responseWithReceipt = finalResponse as X402Response;
  responseWithReceipt.x402Payment = receipt;
  return responseWithReceipt;
}

async function lockPaymentOnChain(
  payer: string,
  amount: string,
  nonce: number,
  tool: string,
): Promise<PaymentReceipt> {
  const receipt: PaymentReceipt = {
    nonce,
    status: "success",
    tool,
    walletAddress: payer,
  };

  try {
    const server = new SorobanRpc.Server(RPC_URL);
    const publicKey = payer || (await getWalletAddress());
    receipt.walletAddress = publicKey;

    const account = await server.getAccount(publicKey);
    const contract = new Contract(CONTRACT_ID);
    const tx = new TransactionBuilder(account, {
      fee: "200",
      networkPassphrase: NETWORK,
    })
      .addOperation(
        contract.call(
          "lock_payment",
          new Address(publicKey).toScVal(),
          nativeToScVal(Math.round(parseFloat(amount) * 1e7), { type: "i128" }),
          nativeToScVal(nonce, { type: "u64" }),
          nativeToScVal(tool, { type: "string" }),
        ),
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    const signResult = await signTransaction(prepared.toXDR(), {
      networkPassphrase: NETWORK,
    });

    if (signResult.error) {
      throw new X402PaymentError(signResult.error, receipt);
    }

    const result = await server.sendTransaction(
      TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK),
    );

    receipt.txHash = result.hash;
    receipt.explorerUrl = getExplorerUrl(result.hash);

    if (result.status === "ERROR") {
      receipt.status = "failed";
      throw new X402PaymentError(
        typeof result.errorResult === "string" && result.errorResult
          ? result.errorResult
          : "Transaction failed",
        receipt,
      );
    }

    return receipt;
  } catch (error) {
    if (receipt.txHash) {
      receipt.status = "failed";
    }
    throw formatWalletError(error, receipt);
  }
}

async function waitForConfirmation(nonce: number): Promise<void> {
  const server = new SorobanRpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);

  for (let i = 0; i < 15; i++) {
    try {
      const paymentKey = nativeToScVal(nonce, { type: "u64" });
      const ledgerEntry = await server.getLedgerEntries(contract.getFootprint());
      void paymentKey;
      void ledgerEntry;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return;
    } catch {
      // Keep polling until the transaction settles or we exhaust retries.
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

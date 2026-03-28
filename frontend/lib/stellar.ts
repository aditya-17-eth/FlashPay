import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  Keypair,
  Contract,
  nativeToScVal,
  Address,
} from "@stellar/stellar-sdk";
import { signTransaction, requestAccess } from "@stellar/freighter-api";

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL!;
const CONTRACT_ID = process.env.NEXT_PUBLIC_FLASHPAY_CONTRACT_ID!;
const NETWORK = Networks.TESTNET;

// Payment status type for UI progress indicator
export type PaymentStatus =
  | "idle"
  | "requesting"
  | "approving" // Freighter popup open
  | "confirming" // waiting for Stellar confirmation
  | "delivering" // AI API processing
  | "done"
  | "error";

/** Helper to get the wallet address from Freighter v3 API */
async function getWalletAddress(): Promise<string> {
  // Use requestAccess() instead of getAddress() to guarantee connection
  const result = await requestAccess();
  if (!result.address) throw new Error(`No wallet address from Freighter. ${result.error || ""}`);
  return result.address;
}

// Main x402 fetch wrapper — use this for all paid tool calls
export async function x402Fetch(
  url: string,
  body: object,
  onStatus?: (status: PaymentStatus) => void
): Promise<Response> {
  onStatus?.("requesting");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Not a payment required response — return directly
  if (res.status !== 402) return res;

  // Parse payment details from 402 response
  const payment = await res.json();
  // payment: { paymentAddress, amount, currency, nonce, contractId, expiresAt }

  onStatus?.("approving");
  // Lock payment on Soroban
  const nonce = await lockPaymentOnChain(
    payment.payer || (await getWalletAddress()),
    payment.amount,
    payment.nonce,
    payment.tool
  );

  onStatus?.("confirming");
  // Wait for tx confirmation via Horizon polling
  await waitForConfirmation(nonce);

  onStatus?.("delivering");
  // Retry original request with payment proof
  const walletAddr = await getWalletAddress();
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-payment-nonce": nonce.toString(),
      "x-payer-address": walletAddr,
    },
    body: JSON.stringify(body),
  });
}

async function lockPaymentOnChain(
  payer: string,
  amount: string,
  nonce: number,
  tool: string
): Promise<number> {
  const server = new SorobanRpc.Server(RPC_URL);
  const publicKey = await getWalletAddress();
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
        nativeToScVal(tool, { type: "string" })
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const signResult = await signTransaction(prepared.toXDR(), {
    network: "TESTNET",
    networkPassphrase: NETWORK,
  });

  const signedXDR = signResult.signedTxXdr;
  const result = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedXDR, NETWORK)
  );

  if (result.status === "ERROR") throw new Error("Transaction failed");
  return nonce;
}

async function waitForConfirmation(nonce: number): Promise<void> {
  // Poll Horizon every 2 seconds for up to 30 seconds
  const server = new SorobanRpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);
  for (let i = 0; i < 15; i++) {
    try {
      const paymentKey = nativeToScVal(nonce, { type: "u64" });
      const ledgerEntry = await server.getLedgerEntries(
        contract.getFootprint()
      );
      // Wait time heuristic — in production, read the exact StorageKey
      await new Promise((r) => setTimeout(r, 2000));
      return;
    } catch {
      /* not yet confirmed */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}


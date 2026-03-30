import { Transaction, TransactionBuilder, Networks, Keypair, SorobanRpc } from "@stellar/stellar-sdk";
import { captureException } from "@/lib/sentry";

const NETWORK = Networks.TESTNET;
const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL!;
const CONTRACT_ID = process.env.NEXT_PUBLIC_FLASHPAY_CONTRACT_ID!;

export async function POST(req: Request) {
  try {
    const { innerTxXDR } = await req.json();

    if (!innerTxXDR || typeof innerTxXDR !== "string") {
      return Response.json({ error: "Invalid tx XDR" }, { status: 400 });
    }

    const innerTx = new Transaction(innerTxXDR, NETWORK);

    const isFlashPayCall = innerTx.operations.every((op) => {
      return op.type === "invokeHostFunction";
    });

    if (!isFlashPayCall) {
      return Response.json({ error: "Unauthorized contract" }, { status: 403 });
    }

    const feeSponsorKey = process.env.FEE_SPONSOR_SECRET_KEY;
    if (!feeSponsorKey) {
      return Response.json({ error: "Fee spending not configured on server" }, { status: 500 });
    }

    const sponsor = Keypair.fromSecret(feeSponsorKey);
    const feeBump = TransactionBuilder.buildFeeBumpTransaction(
      sponsor,
      "200",
      innerTx,
      NETWORK,
    );

    feeBump.sign(sponsor);
    const server = new SorobanRpc.Server(RPC_URL);

    const result = await server.sendTransaction(feeBump);
    if (result.status === "ERROR") {
      captureException(new Error(`Fee bump failed ${String(result.errorResult || "unknown error")}`));
      return Response.json({ error: "Simulation failed" }, { status: 500 });
    }

    return Response.json({ hash: result.hash });
  } catch (error) {
    captureException(error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

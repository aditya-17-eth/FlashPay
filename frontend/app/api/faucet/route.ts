import { z } from "zod";
import { TransactionBuilder, Networks, Horizon } from "@stellar/stellar-sdk";

const FaucetSchema = z.object({
  signedXDR: z.string().min(10),
});

function mapFaucetError(error: unknown) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Failed to submit faucet transaction";

  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("op_no_source_account")) {
    return "Your wallet needs XLM first. Visit https://friendbot.stellar.org";
  }

  if (normalizedMessage.includes("op_underfunded")) {
    return "Not enough XLM. You need at least 10 XLM. Visit https://friendbot.stellar.org";
  }

  if (normalizedMessage.includes("op_already_exists")) {
    return "The USDC trustline already exists. Try the swap again.";
  }

  if (normalizedMessage.includes("op_no_trust")) {
    return "Your wallet still needs the USDC trustline. Retry the faucet button once.";
  }

  if (normalizedMessage.includes("op_low_reserve")) {
    return "Your wallet needs a bit more XLM reserve before adding the USDC trustline. Visit https://friendbot.stellar.org";
  }

  return rawMessage;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = FaucetSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { signedXDR } = parsed.data;
    const server = new Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL!);
    const result = await server.submitTransaction(
      TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET),
    );

    return Response.json({ success: true, hash: result.hash });
  } catch (error) {
    return Response.json(
      { error: mapFaucetError(error) },
      { status: 500 },
    );
  }
}

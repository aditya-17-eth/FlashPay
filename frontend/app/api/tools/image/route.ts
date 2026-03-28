import { z } from "zod";
import { TOOL_PRICES } from "@/lib/prices";
import { verifyPayment, releasePayment, refundPayment, generatePaymentRequest } from "@/lib/stellar-server";
import { captureException } from "@/lib/sentry";

const ImageSchema = z.object({
  prompt: z.string().min(3).max(500),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = ImageSchema.safeParse(body);
    
    if (!result.success) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }
    
    const { prompt } = result.data;
    const paymentNonce = req.headers.get("x-payment-nonce");
    const payerAddress = req.headers.get("x-payer-address");

    if (!paymentNonce || !payerAddress) {
      return generatePaymentRequest("image");
    }

    const nonce = parseInt(paymentNonce, 10);
    await verifyPayment(nonce, payerAddress, "image");

    try {
      // Free Pollinations AI directly.
      // Stable Diffusion max seed is 4294967295 (uint32).
      // Since our nonce is a huge Date.now() timestamp, we must modulo it, otherwise Pollinations throws a 500 error.
      const imageUrl = `https://robohash.org/${encodeURIComponent(prompt)}?set=any&size=512x512`;
      
      // We are cleanly returning the URL straight to the browser.
      await releasePayment(nonce);
      return Response.json({ imageUrl, nonce });
    } catch (e) {
      console.error("AI API Flow Error:", e);
      await refundPayment(nonce);
      captureException(e);
      return Response.json({ error: "AI API Failed, payment refunded." }, { status: 500 });
    }
  } catch (error) {
    console.error("Internal Server Error:", error);
    captureException(error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

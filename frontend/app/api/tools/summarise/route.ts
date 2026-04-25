import { z } from "zod";
import { TOOL_PRICES } from "@/lib/prices";
import { groq } from "@/lib/groq";
import { verifyPayment, releasePayment, refundPayment, generatePaymentRequest, handleSessionPayment } from "@/lib/stellar-server";
import { captureException } from "@/lib/sentry";

const SummariseSchema = z.object({
  text: z.string().min(10).max(10000),
  mode: z.enum(["summarise", "rewrite", "bullets"]),
});

const SYSTEM_PROMPTS = {
  summarise: "Summarise the following text concisely in 3-5 sentences.",
  rewrite: "Rewrite the following text to be clearer and more engaging. Keep the same meaning.",
  bullets: "Convert the following text into a clear bullet-point list of key points.",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = SummariseSchema.safeParse(body);
    if (!result.success) return Response.json({ error: "Invalid input" }, { status: 400 });
    
    const { text, mode } = result.data;

    // Account Abstraction: session-based payment
    const sessionOwner = req.headers.get("x-session-owner");
    if (sessionOwner) {
      const nonce = await handleSessionPayment(sessionOwner, "summarise");
      try {
        let extracted = "";
        if (process.env.GROQ_API_KEY === "mock-groq-key" || !process.env.GROQ_API_KEY) {
          extracted = `[Mock ${mode} Result] Session payment succeeded! Mock response for session-based tool usage.`;
        } else {
          const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] },
              { role: "user", content: text.replace(/<[^>]*>?/gm, '') },
            ],
            max_tokens: 1024,
          });
          extracted = completion.choices[0]?.message?.content || "";
        }
        await releasePayment(nonce);
        return Response.json({ result: extracted, nonce });
      } catch (e) {
        await refundPayment(nonce);
        captureException(e);
        return Response.json({ error: "AI API Failed, session payment refunded.", sessionExpired: false }, { status: 500 });
      }
    }

    const paymentNonce = req.headers.get("x-payment-nonce");
    const payerAddress = req.headers.get("x-payer-address");

    if (!paymentNonce || !payerAddress) return generatePaymentRequest("summarise");

    const nonce = parseInt(paymentNonce, 10);
    await verifyPayment(nonce, payerAddress, "summarise");

    try {
      let extracted = "";
      if (process.env.GROQ_API_KEY === "mock-groq-key" || !process.env.GROQ_API_KEY) {
        extracted = `[Mock ${mode} Result] The blockchain transaction succeeded! Since you are using a mock Groq API key, here is a mock response demonstrating that the tool UI and payment integration handled your request perfectly end-to-end.`;
      } else {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] },
            { role: "user", content: text.replace(/<[^>]*>?/gm, '') }, // Strip HTML as required
          ],
          max_tokens: 1024,
        });
        extracted = completion.choices[0]?.message?.content || "";
      }

      await releasePayment(nonce);
      return Response.json({ result: extracted, nonce });
    } catch (e) {
      await refundPayment(nonce);
      captureException(e);
      return Response.json({ error: "AI API Failed, payment refunded." }, { status: 500 });
    }
  } catch (error) {
    captureException(error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

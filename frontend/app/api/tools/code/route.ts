import { z } from "zod";
import { TOOL_PRICES } from "@/lib/prices";
import { groq } from "@/lib/groq";
import { verifyPayment, releasePayment, refundPayment, generatePaymentRequest, handleSessionPayment } from "@/lib/stellar-server";
import { captureException } from "@/lib/sentry";

const CodeSchema = z.object({
  description: z.string().min(10).max(1000),
  language: z.enum(["javascript", "typescript", "python", "rust", "solidity", "go", "other"]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = CodeSchema.safeParse(body);
    if (!result.success) return Response.json({ error: "Invalid input" }, { status: 400 });
    
    const { description, language } = result.data;

    // Account Abstraction: session-based payment
    const sessionOwner = req.headers.get("x-session-owner");
    if (sessionOwner) {
      const nonce = await handleSessionPayment(sessionOwner, "code");
      const systemPrompt = `You are an expert ${language} developer.\nGenerate clean, well-commented, production-ready ${language} code.\nReturn ONLY the code block with no explanation before or after.\nAdd brief inline comments for clarity.`;
      try {
        let extracted = "";
        if (process.env.GROQ_API_KEY === "mock-groq-key" || !process.env.GROQ_API_KEY) {
          extracted = `// [Mock ${language} Result]\n// Session payment succeeded!\nprint("Hello from FlashPay session!");`;
        } else {
          const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: description.replace(/<[^>]*>?/gm, '') },
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

    if (!paymentNonce || !payerAddress) return generatePaymentRequest("code");

    const nonce = parseInt(paymentNonce, 10);
    await verifyPayment(nonce, payerAddress, "code");

    const systemPrompt = `You are an expert ${language} developer.
Generate clean, well-commented, production-ready ${language} code.
Return ONLY the code block with no explanation before or after.
Add brief inline comments for clarity.`;

    try {
      let extracted = "";
      if (process.env.GROQ_API_KEY === "mock-groq-key" || !process.env.GROQ_API_KEY) {
        extracted = `// [Mock ${language} Result]\n// The blockchain transaction succeeded!\n// Since you are using a mock Groq API key, here is a mock response demonstrating that the tool UI and payment integration handled your request perfectly end-to-end.\n\nprint("Hello World from FlashPay Mock Code Generator!");`;
      } else {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: description.replace(/<[^>]*>?/gm, '') },
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

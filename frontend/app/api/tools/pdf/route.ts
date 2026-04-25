import { z } from "zod";
import { groq } from "@/lib/groq";
import { verifyPayment, releasePayment, refundPayment, generatePaymentRequest, handleSessionPayment } from "@/lib/stellar-server";
import { captureException } from "@/lib/sentry";
import pdfParse from "pdf-parse";

// PDF parsing server-side logic
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const question = formData.get("question") as string;
    
    if (!file || file.type !== "application/pdf") {
      return Response.json({ error: "Invalid PDF file" }, { status: 400 });
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File must be < 10MB" }, { status: 400 });
    }

    const QuestionSchema = z.string().max(500).optional();
    const parsedQ = QuestionSchema.safeParse(question);
    if (!parsedQ.success) return Response.json({ error: "Invalid question" }, { status: 400 });

    // Account Abstraction: session-based payment
    const sessionOwner = req.headers.get("x-session-owner");
    if (sessionOwner) {
      const nonce = await handleSessionPayment(sessionOwner, "pdf");
      let pdfText = "";
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parsed = await pdfParse(buffer);
        pdfText = parsed.text.slice(0, 8000);
      } catch (err) {
        captureException(err);
        await refundPayment(nonce);
        return Response.json({ error: "Failed to parse PDF" }, { status: 400 });
      }
      const systemPrompt = parsedQ.data
        ? `Answer the following question about the document concisely: "${parsedQ.data}"`
        : "Provide a comprehensive summary of this document.";
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: pdfText },
          ],
          max_tokens: 1024,
        });
        const extracted = completion.choices[0]?.message?.content || "";
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

    if (!paymentNonce || !payerAddress) return generatePaymentRequest("pdf");

    const nonce = parseInt(paymentNonce, 10);
    await verifyPayment(nonce, payerAddress, "pdf");

    let pdfText = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await pdfParse(buffer);
      pdfText = parsed.text.slice(0, 8000); // Limit context window
      // Buffer falls out of scope to be garbage collected immediately
    } catch (err) {
      captureException(err);
      await refundPayment(nonce);
      return Response.json({ error: "Failed to parse PDF" }, { status: 400 });
    }

    const systemPrompt = parsedQ.data
      ? `Answer the following question about the document concisely: "${parsedQ.data}"`
      : "Provide a comprehensive summary of this document including key points, main arguments, and conclusions.";

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: pdfText },
        ],
        max_tokens: 1024,
      });

      const extracted = completion.choices[0]?.message?.content || "";
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

import { z } from "zod";
import { verifyPayment, releasePayment, refundPayment, generatePaymentRequest } from "@/lib/stellar-server";
import { captureException } from "@/lib/sentry";

const IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";
const HUGGING_FACE_IMAGE_ENDPOINT = `https://router.huggingface.co/hf-inference/models/${IMAGE_MODEL}`;

const ImageSchema = z.object({
  prompt: z.string().min(3).max(500),
});

function getHuggingFaceApiKey() {
  return process.env.HUGGINGFACE_API_KEY?.trim() || process.env.HF_TOKEN?.trim();
}

async function generateImageWithHuggingFace(prompt: string, seed: number) {
  const apiKey = getHuggingFaceApiKey();

  if (!apiKey || apiKey === "hf_your_flux_inference_token_here") {
    throw new Error("HUGGINGFACE_API_KEY is missing. Add your Hugging Face Inference Providers token in .env.local.");
  }

  const response = await fetch(HUGGING_FACE_IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "image/png",
    },
    cache: "no-store",
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width: 768,
        height: 768,
        num_inference_steps: 4,
        seed,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Hugging Face image generation failed");
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    const errorText = await response.text();
    throw new Error(errorText || "Hugging Face returned a non-image response");
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${imageBuffer.toString("base64")}`;
}

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
    if (Number.isNaN(nonce)) {
      return Response.json({ error: "Invalid payment nonce" }, { status: 400 });
    }

    await verifyPayment(nonce, payerAddress, "image");

    try {
      const sanitizedPrompt = prompt.replace(/<[^>]*>?/gm, "").trim();
      const seed = nonce % 2147483647;
      const imageUrl = await generateImageWithHuggingFace(sanitizedPrompt, seed);

      await releasePayment(nonce);
      return Response.json({ imageUrl, nonce, model: IMAGE_MODEL });
    } catch (error) {
      console.error("Image generation failed:", error);
      await refundPayment(nonce);
      captureException(error);
      return Response.json(
        {
          error: error instanceof Error ? error.message : "Image generation failed, payment refunded.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Internal Server Error:", error);
    captureException(error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

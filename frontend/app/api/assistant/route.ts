import { z } from "zod";
import { groq } from "@/lib/groq";
import { captureException } from "@/lib/sentry";

const AssistantSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(2000),
    })
  ).max(20),
});

const ASSISTANT_SYSTEM = `You are a helpful AI assistant inside FlashPay,
a pay-per-use AI toolkit on Stellar blockchain.

You have access to 4 paid tools:
- Image Generator (0.005 USDC): generates images from text prompts
- Text Summariser (0.001 USDC): summarises, rewrites, or bullet-points text
- PDF Analyser (0.002 USDC): answers questions about uploaded PDFs
- Code Generator (0.003 USDC): generates code in any language

You are FREE to use. You do NOT charge for conversation.

If the user's message is clearly a task for one of the tools above,
END your response with a JSON block on its own line:
TOOL_SUGGESTION: {"tool":"image","reason":"You want an image generated","inputHint":"your prompt here"}

Valid tool values: "image", "summarise", "pdf", "code"
Only suggest a tool when you are confident it matches the user's need.
Never suggest a tool for casual conversation.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = AssistantSchema.safeParse(body);
    if (!result.success) return Response.json({ error: "Invalid input" }, { status: 400 });
    
    const { messages } = result.data;
    
    // Validate length and sanitize
    const sanitizedMessages = messages.map(m => ({
        role: m.role,
        content: m.content.replace(/<[^>]*>?/gm, '')
    }));

    if (process.env.GROQ_API_KEY === "mock-groq-key" || !process.env.GROQ_API_KEY) {
      return Response.json({ result: "This is a mock assistant reply. Since you are using a mock Groq API key, I am bypassing the LLM. Feel free to ask me anything or test the Image Generator!\n\nTOOL_SUGGESTION: {\"tool\":\"image\",\"reason\":\"I detected you want an image\",\"inputHint\":\"Try asking for an image\"}" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM },
        ...sanitizedMessages
      ],
      max_tokens: 1024,
    });

    return Response.json({ result: completion.choices[0]?.message?.content || "" });
  } catch (error) {
    console.error("Assistant Error:", error);
    captureException(error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

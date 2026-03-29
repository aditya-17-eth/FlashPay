import "server-only";
import Groq from "groq-sdk";

const normalizedGroqApiKey = process.env.GROQ_API_KEY?.trim();

if (normalizedGroqApiKey) {
  process.env.GROQ_API_KEY = normalizedGroqApiKey;
}

export const groq = new Groq({
  apiKey: normalizedGroqApiKey && normalizedGroqApiKey !== "mock-groq-key"
    ? normalizedGroqApiKey
    : "mock-groq-key",
});

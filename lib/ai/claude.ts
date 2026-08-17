// Server-only. Raw fetch keeps the dependency footprint unchanged (CLAUDE.md:
// "Do not add a new dependency without saying why and asking first") — same
// pattern as lib/cloudinary.ts. API key never reaches the browser (rule 10).
const API_KEY = process.env.ANTHROPIC_API_KEY!;
const MODEL = "claude-opus-5";

export async function callClaude(prompt: string): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
}> {
  // ai-engine.md: "Loading ... time out at 30s."
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Claude API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
    stop_reason?: string;
  };

  if (data.stop_reason === "refusal") {
    throw new Error("Content refused by provider");
  }

  const textBlock = data.content?.find((b) => b.type === "text");
  return {
    text: textBlock?.text?.trim() ?? "",
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

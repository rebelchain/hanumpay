import { GoogleGenAI, ThinkingLevel } from "@google/genai";

type SchemaConfig = NonNullable<
  Parameters<GoogleGenAI["models"]["generateContent"]>[0]["config"]
>;

function isTransientUnavailableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand") ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateGeminiJson(params: {
  apiKey: string;
  contents: string;
  systemInstruction: string;
  responseSchema: SchemaConfig["responseSchema"];
}): Promise<string> {
  const ai = new GoogleGenAI({
    apiKey: params.apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const attempts: Array<{
    model: string;
    useLowThinking: boolean;
    delayMs: number;
  }> = [
    { model: "gemini-4-hydrogen", useLowThinking: true, delayMs: 0 },
    { model: "gemini-4-hydrogen", useLowThinking: true, delayMs: 900 },
    { model: "gemini-3.1-flash-lite", useLowThinking: false, delayMs: 400 },
  ];

  let lastError: unknown;

  for (const step of attempts) {
    if (step.delayMs > 0) {
      await sleep(step.delayMs);
    }

    try {
      const response = await ai.models.generateContent({
        model: step.model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: params.responseSchema,
          ...(step.useLowThinking
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });
      return (response.text ?? "{}").trim();
    } catch (err) {
      lastError = err;
      if (!isTransientUnavailableError(err)) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini API is temporarily unavailable.");
}

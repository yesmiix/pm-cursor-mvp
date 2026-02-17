/**
 * Вызовы LLM: embeddings и chat completions.
 * Использует LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, EMBEDDING_MODEL.
 */

const getConfig = () => {
  const baseUrl = process.env.LLM_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const embeddingModel = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
  return { baseUrl, apiKey, model, embeddingModel };
};

export async function embeddings(text: string): Promise<number[]> {
  const { baseUrl, apiKey, embeddingModel } = getConfig();
  if (!baseUrl || !apiKey) {
    throw new Error("LLM_BASE_URL или LLM_API_KEY не заданы.");
  }

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: embeddingModel,
      input: text,
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    data?: Array<{ embedding?: number[] }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    const msg = json?.error?.message ?? "Ошибка embeddings API.";
    throw new Error(msg);
  }

  const embedding = json?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error("Ответ embeddings не содержит вектор.");
  }
  return embedding;
}

export async function chat(systemPrompt: string, userMessage: string): Promise<string> {
  const { baseUrl, apiKey, model } = getConfig();
  if (!baseUrl || !apiKey) {
    throw new Error("LLM_BASE_URL или LLM_API_KEY не заданы.");
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    const msg = json?.error?.message ?? "Ошибка chat API.";
    throw new Error(msg);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("LLM не вернула текст ответа.");
  }
  return content;
}

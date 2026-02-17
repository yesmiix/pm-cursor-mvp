import { NextResponse } from "next/server";
import { cosineSimilarity } from "@/lib/cosine";
import { embeddings, chat } from "@/lib/llm";
import * as storage from "@/lib/storage";

const TOP_K = 6;

const RAG_SYSTEM_PROMPT = `Ты отвечаешь только на основе CONTEXT ниже. Если в контексте нет информации для ответа на вопрос — скажи: "В документе нет информации, чтобы ответить." Не додумывай и не используй внешние знания.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string };
    const question = typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      return NextResponse.json(
        { ok: false, error: "Поле question обязательно." },
        { status: 400 },
      );
    }

    const [storedChunks, storedEmbeddings] = await Promise.all([
      storage.getChunks(),
      storage.getEmbeddings(),
    ]);

    if (
      storedChunks.length === 0 ||
      storedEmbeddings.length !== storedChunks.length
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Документ не загружен или эмбеддинги не готовы. Сначала сохраните документ на странице /kb.",
        },
        { status: 400 },
      );
    }

    const queryEmbedding = await embeddings(question);

    const withScores: { index: number; score: number }[] = storedEmbeddings.map(
      (vec, index) => ({
        index,
        score: cosineSimilarity(queryEmbedding, vec),
      }),
    );
    withScores.sort((a, b) => b.score - a.score);
    const top = withScores.slice(0, TOP_K);

    const contextParts = top.map(
      (t) => storedChunks[t.index],
    ).filter(Boolean);
    const context = contextParts.join("\n\n---\n\n");

    const userMessage = `CONTEXT:\n${context}\n\nQUESTION: ${question}`;
    const answer = await chat(RAG_SYSTEM_PROMPT, userMessage);

    const chunksWithScores = top.map((t) => ({
      content: storedChunks[t.index] ?? "",
      score: Math.round(t.score * 1000) / 1000,
    }));

    return NextResponse.json({
      ok: true,
      answer,
      chunks: chunksWithScores,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка при ответе на вопрос.";
    console.error("POST /api/ask:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

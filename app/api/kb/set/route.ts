import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunk";
import { embeddings } from "@/lib/llm";
import * as storage from "@/lib/storage";

const MAX_CONTENT_LENGTH = 100_000;
const WARN_CONTENT_LENGTH = 50_000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: string; content?: string };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content : "";

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Поле title обязательно." },
        { status: 400 },
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          error: `Документ слишком большой (максимум ${MAX_CONTENT_LENGTH} символов).`,
        },
        { status: 400 },
      );
    }

    if (content.length > WARN_CONTENT_LENGTH) {
      // Не блокируем, только предупреждаем в ответе
    }

    const chunks = chunkText(content);
    if (chunks.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Документ пустой или не удалось разбить на чанки." },
        { status: 400 },
      );
    }

    const embeddingVectors: number[][] = [];
    for (const c of chunks) {
      const vec = await embeddings(c);
      embeddingVectors.push(vec);
    }

    const doc = {
      title,
      content,
      updatedAt: new Date().toISOString(),
    };

    await storage.setDoc(doc);
    await storage.setChunks(chunks);
    await storage.setEmbeddings(embeddingVectors);

    return NextResponse.json({
      ok: true,
      chunksCount: chunks.length,
      warning:
        content.length > WARN_CONTENT_LENGTH
          ? "Документ больше 50k символов — возможны ограничения по лимитам."
          : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка сохранения документа.";
    console.error("POST /api/kb/set:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

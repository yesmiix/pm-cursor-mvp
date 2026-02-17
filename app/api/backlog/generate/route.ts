import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { chat } from "@/lib/llm";
import * as storage from "@/lib/storage";

let cachedPrompt: string | null = null;

async function getBacklogGeneratePrompt(): Promise<string> {
  if (cachedPrompt) return cachedPrompt;
  const filePath = path.join(process.cwd(), "BACKLOG_GENERATE_PROMPT.md");
  try {
    const file = await fs.readFile(filePath, "utf8");
    cachedPrompt = file;
    return file;
  } catch (err) {
    console.error("Failed to read BACKLOG_GENERATE_PROMPT.md:", err);
    cachedPrompt =
      'Ты продуктовый аналитик. На основе документа о продукте предложи 5–8 приоритетных фич. Ответь только валидным JSON: { "features": [ { "title": "...", "description": "..." } ] }.';
    return cachedPrompt;
  }
}

function parseFeaturesFromResponse(raw: string): { title: string; description: string }[] {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0]! : trimmed;
  try {
    const data = JSON.parse(jsonStr) as { features?: Array<{ title?: string; description?: string }> };
    const list = data?.features;
    if (!Array.isArray(list)) return [];
    return list
      .filter((f) => f && (f.title || f.description))
      .map((f) => ({
        title: typeof f.title === "string" ? f.title.trim() : "Без названия",
        description: typeof f.description === "string" ? f.description.trim() : "",
      }));
  } catch {
    return [];
  }
}

export async function POST() {
  try {
    const doc = await storage.getDoc();
    if (!doc || !doc.content?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Документ о продукте не загружен. Сначала сохраните документ на странице «База знаний» (/kb).",
        },
        { status: 400 },
      );
    }

    const systemPrompt = await getBacklogGeneratePrompt();
    const userMessage = `Документ о продукте:\n\nНазвание: ${doc.title}\n\nСодержание:\n${doc.content}`;

    const raw = await chat(systemPrompt, userMessage);
    const features = parseFeaturesFromResponse(raw);

    if (features.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Не удалось разобрать предложенные фичи из ответа модели. Попробуйте ещё раз или отредактируйте промпт в BACKLOG_GENERATE_PROMPT.md.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, features });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка генерации фич.";
    console.error("POST /api/backlog/generate:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

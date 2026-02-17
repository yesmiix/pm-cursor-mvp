import { NextResponse } from "next/server";
import { getEntries, getSegments } from "@/lib/feedback-storage";
import { getFeedbackPrompts } from "@/lib/feedback-prompts";
import { chat } from "@/lib/llm";

const MIN_ENTRIES_FOR_PAINS = 3;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get("segmentId");
    if (!segmentId) {
      return NextResponse.json(
        { ok: false, error: "Укажите segmentId." },
        { status: 400 },
      );
    }

    const [entries, segments, { pains: painsPrompt }] = await Promise.all([
      getEntries(segmentId),
      getSegments(),
      getFeedbackPrompts(),
    ]);

    const segment = segments.find((s) => s.id === segmentId);
    if (!segment) {
      return NextResponse.json(
        { ok: false, error: "Сегмент не найден." },
        { status: 400 },
      );
    }

    if (entries.length < MIN_ENTRIES_FOR_PAINS) {
      return NextResponse.json({
        ok: true,
        pains: [],
        message: "Недостаточно данных. Добавьте ещё фидбек (минимум 3 записи по сегменту).",
      });
    }

    const quotes = entries.slice(0, 30).map((e) => e.text);
    const userMessage = `Сегмент: ${segment.name}\n${segment.description}\n\nЦитаты/отзывы:\n${quotes.map((q, i) => `[${i + 1}] ${q}`).join("\n")}`;

    const raw = await chat(painsPrompt, userMessage);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;
    let pains: string[] = [];
    try {
      const data = JSON.parse(jsonStr) as { pains?: string[] };
      pains = Array.isArray(data.pains) ? data.pains : [];
    } catch {
      pains = [];
    }

    return NextResponse.json({ ok: true, pains });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка генерации болей.";
    console.error("GET /api/feedback/pains:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

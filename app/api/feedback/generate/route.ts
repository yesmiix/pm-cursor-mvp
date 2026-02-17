import { NextResponse } from "next/server";
import { getEntries, getSegments } from "@/lib/feedback-storage";
import { getFeedbackPrompts } from "@/lib/feedback-prompts";
import { chat } from "@/lib/llm";
import type { JTBDFeedback } from "@/lib/feedback-types";

const MAX_ENTRIES_FOR_GENERATE = 20;
const MIN_ENTRIES = 2;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { segmentId?: string };
    const segmentId = typeof body.segmentId === "string" ? body.segmentId.trim() : "";
    if (!segmentId) {
      return NextResponse.json(
        { ok: false, error: "Укажите segmentId." },
        { status: 400 },
      );
    }

    const [entries, segments, { jtbd: jtbdPrompt }] = await Promise.all([
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

    const slice = entries.slice(0, MAX_ENTRIES_FOR_GENERATE);
    if (slice.length < MIN_ENTRIES) {
      return NextResponse.json(
        {
          ok: false,
          error: "Недостаточно данных для генерации. Добавьте минимум 2 записи фидбека по этому сегменту.",
        },
        { status: 400 },
      );
    }

    const quotesText = slice
      .map((e, i) => `[${i + 1}] ${e.text}`)
      .join("\n");

    const userMessage = `Сегмент: ${segment.name}\nОписание: ${segment.description}\n\nСырые цитаты/наблюдения:\n${quotesText}`;

    const raw = await chat(jtbdPrompt, userMessage);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;
    let simulation: JTBDFeedback;
    try {
      const data = JSON.parse(jsonStr) as Record<string, unknown>;
      simulation = {
        job: typeof data.job === "string" ? data.job : "",
        situation: typeof data.situation === "string" ? data.situation : "",
        motivation: typeof data.motivation === "string" ? data.motivation : "",
        desiredOutcome: typeof data.desiredOutcome === "string" ? data.desiredOutcome : "",
        frictions: typeof data.frictions === "string" ? data.frictions : "",
        quote: typeof data.quote === "string" ? data.quote : "",
        confidence: typeof data.confidence === "string" ? data.confidence : undefined,
        basedOn: Array.isArray(data.basedOn) ? (data.basedOn as string[]) : undefined,
      };
    } catch {
      return NextResponse.json(
        { ok: false, error: "Не удалось разобрать ответ модели. Попробуйте ещё раз." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, simulation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка генерации JTBD.";
    console.error("POST /api/feedback/generate:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getEntries, appendEntry, getSegments } from "@/lib/feedback-storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get("segmentId") ?? undefined;
    const entries = await getEntries(segmentId);
    return NextResponse.json({ ok: true, entries });
  } catch (err) {
    console.error("GET /api/feedback/entries:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка загрузки записей." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      segmentId?: string;
      text?: string;
      source?: string;
      tags?: string[];
    };
    const segmentId = typeof body.segmentId === "string" ? body.segmentId.trim() : "";
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const source = typeof body.source === "string" ? body.source.trim() || "manual" : "manual";
    const tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === "string") : undefined;

    if (!segmentId) {
      return NextResponse.json(
        { ok: false, error: "Поле segmentId обязательно." },
        { status: 400 },
      );
    }
    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Поле text обязательно." },
        { status: 400 },
      );
    }

    const segments = await getSegments();
    if (!segments.some((s) => s.id === segmentId)) {
      return NextResponse.json(
        { ok: false, error: "Сегмент не найден." },
        { status: 400 },
      );
    }

    const entry = await appendEntry({ segmentId, text, source, tags });
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error("POST /api/feedback/entries:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка добавления записи." },
      { status: 500 },
    );
  }
}

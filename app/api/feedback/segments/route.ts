import { NextResponse } from "next/server";
import { getSegments, setSegments, ensureSegmentsAndSeed, getEntries } from "@/lib/feedback-storage";

export async function GET() {
  try {
    const segments = await ensureSegmentsAndSeed();
    const allEntries = await getEntries();
    const withCount = segments.map((s) => ({
      ...s,
      count: allEntries.filter((e) => e.segmentId === s.id).length,
    }));
    return NextResponse.json({ ok: true, segments: withCount });
  } catch (err) {
    console.error("GET /api/feedback/segments:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка загрузки сегментов." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; description?: string };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Поле name обязательно." },
        { status: 400 },
      );
    }
    const segments = await getSegments();
    const id = `seg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newSegment = { id, name, description: description || "" };
    const next = [...segments, newSegment];
    await setSegments(next);
    return NextResponse.json({ ok: true, segment: newSegment });
  } catch (err) {
    console.error("POST /api/feedback/segments:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка создания сегмента." },
      { status: 500 },
    );
  }
}

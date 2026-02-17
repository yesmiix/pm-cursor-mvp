import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

export async function GET() {
  try {
    const doc = await storage.getDoc();
    const chunks = await storage.getChunks();

    if (!doc) {
      return NextResponse.json({
        ok: true,
        doc: null,
        meta: { chunksCount: 0 },
      });
    }

    return NextResponse.json({
      ok: true,
      doc: {
        title: doc.title,
        content: doc.content,
        updatedAt: doc.updatedAt,
      },
      meta: { chunksCount: chunks.length },
    });
  } catch (err) {
    console.error("GET /api/kb/get:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка чтения документа." },
      { status: 500 },
    );
  }
}

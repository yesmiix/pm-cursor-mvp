import { NextResponse } from "next/server";
import * as storage from "@/lib/storage";

export async function POST() {
  try {
    await storage.clearKb();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/kb/clear:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка удаления документа." },
      { status: 500 },
    );
  }
}

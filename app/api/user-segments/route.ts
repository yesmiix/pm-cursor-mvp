import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type SegmentsRequestBody = {
  context?: string;
};

let cachedPrompt: string | null = null;

async function getSegmentsPrompt() {
  if (cachedPrompt) return cachedPrompt;

  const filePath = path.join(process.cwd(), "USER_SEGMENTS_PROMPT.md");
  try {
    const file = await fs.readFile(filePath, "utf8");
    cachedPrompt = file;
    return file;
  } catch (error) {
    console.error("Failed to read USER_SEGMENTS_PROMPT.md:", error);
    cachedPrompt =
      "Ты CPO цифрового продукта. На основе описания продукта/фичи тебе нужно выделить 4–5 пользовательских сегментов.";
    return cachedPrompt;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SegmentsRequestBody;
    const context = body.context?.trim();

    if (!context) {
      return NextResponse.json(
        {
          ok: false,
          error: "Поле context обязательно. Опиши продукт или задачу.",
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.LLM_API_KEY;
    const baseUrl = process.env.LLM_BASE_URL;
    const model = process.env.LLM_MODEL || "gpt-4o-mini";

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "LLM_API_KEY или LLM_BASE_URL не заданы. Проверь конфигурацию .env.local или переменные окружения Vercel.",
        },
        { status: 500 },
      );
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
    const basePrompt = await getSegmentsPrompt();

    const messages = [
      {
        role: "system" as const,
        content: basePrompt,
      },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: context,
          },
        ],
      },
    ];

    const llmResponse = await fetch(`${normalizedBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    const llmJson: any = await llmResponse.json().catch(() => null);

    if (!llmResponse.ok) {
      const message =
        (llmJson && (llmJson.error?.message || llmJson.message)) ||
        "Ошибка ответа от LLM.";
      console.error("LLM error response (user-segments):", llmJson);
      return NextResponse.json(
        {
          ok: false,
          error: message,
        },
        { status: llmResponse.status },
      );
    }

    const resultText: string | undefined =
      llmJson?.choices?.[0]?.message?.content;

    if (!resultText) {
      return NextResponse.json(
        {
          ok: false,
          error: "LLM не вернула текст ответа для сегментов.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        result: resultText,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unexpected error in /api/user-segments:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Непредвиденная ошибка на сервере.",
      },
      { status: 500 },
    );
  }
}


import { NextResponse } from "next/server";

type DesignRequestBody = {
  featureRequest?: string;
  images?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DesignRequestBody;

    const featureRequest = body.featureRequest?.trim();
    const images = body.images ?? [];

    if (!featureRequest) {
      return NextResponse.json(
        { ok: false, error: "Поле featureRequest обязательно." },
        { status: 400 },
      );
    }

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Необходимо передать хотя бы одно изображение в images.",
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
            "LLM_API_KEY или LLM_BASE_URL не заданы. Проверьте конфигурацию .env.local.",
        },
        { status: 500 },
      );
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

    const messages = [
      {
        role: "system" as const,
        content:
          "ты продуктовый дизайнер, отвечай строго структурировано. Опиши: 1) Цель фичи 2) Пользовательские сценарии 3) Основные экраны/секции 4) Требования к UX 5) Возможные риски и компромиссы.",
      },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: featureRequest,
          },
          ...images.map((url) => ({
            type: "image_url" as const,
            image_url: {
              url,
            },
          })),
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
      console.error("LLM error response:", llmJson);
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
          error: "LLM не вернула текст ответа.",
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
    console.error("Unexpected error in /api/design:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Непредвиденная ошибка на сервере.",
      },
      { status: 500 },
    );
  }
}


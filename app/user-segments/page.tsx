"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

type SegmentsResponse = {
  ok: boolean;
  result?: string;
  error?: string;
};

type ParsedSegment = {
  name: string;
  description: string;
  jtbd: string[];
  percent: string;
};

function parseSegmentsFromMarkdown(raw: string): {
  intro: string;
  segments: ParsedSegment[];
} {
  const intro: string[] = [];
  const tableRows: string[][] = [];
  const lines = raw.split(/\r?\n/);

  let inTable = false;
  let headerSkipped = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isTableRow = /^\|/.test(trimmed) && /\|$/.test(trimmed);
    if (isTableRow) {
      inTable = true;
      const cells = trimmed
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
      const isSeparator = cells.every((c) => /^[-:\s]+$/.test(c));
      if (isSeparator) {
        headerSkipped = true;
        continue;
      }
      const isSeparatorRow = cells.every((c) => /^[-:\s]+$/.test(c));
      if (isSeparatorRow) {
        headerSkipped = true;
        continue;
      }
      if (!headerSkipped) {
        headerSkipped = true;
        continue;
      }
      if (cells.length >= 4 && cells.some((c) => c.length > 0)) {
        tableRows.push(cells);
      }
      continue;
    }

    if (!inTable && trimmed.length > 0) {
      intro.push(trimmed);
    }
  }

  const segments: ParsedSegment[] = tableRows.map((row) => {
    const name = (row[0] ?? "").trim();
    const description = (row[1] ?? "").trim();
    const jtbdRaw = (row[2] ?? "").trim();
    const percent = (row[3] ?? "").trim();

    const jtbd = jtbdRaw
      .split(/\n/)
      .map((s) => s.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);

    return { name, description, jtbd, percent };
  });

  return {
    intro: intro.join(" ").trim(),
    segments,
  };
}

export default function UserSegmentsPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<{ id: number; title: string }[]>([
    { id: 1, title: "Segment chat 1" },
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [chatCounter, setChatCounter] = useState(1);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pathname = usePathname();

  const handleNewChat = useCallback(() => {
    const nextId = chatCounter + 1;
    setChatCounter(nextId);
    setChats((prev) => [...prev, { id: nextId, title: `Segment chat ${nextId}` }]);
    setActiveChatId(nextId);

    setInput("");
    setResult("");
    setError("");
  }, [chatCounter]);

  const handleSelectChat = useCallback((id: number) => {
    setActiveChatId(id);
  }, []);

  const handleGenerate = useCallback(async () => {
    setError("");
    setResult("");

    if (!input.trim()) {
      setError("Опишите продукт или задачу, для которой нужны сегменты.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user-segments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: input,
        }),
      });

      const data: SegmentsResponse = await response.json();

      if (!response.ok || !data.ok) {
        setError(
          data.error ??
            "Не удалось сгенерировать пользовательские сегменты. Попробуйте ещё раз.",
        );
        return;
      }

      setResult(data.result ?? "");
    } catch (err) {
      console.error(err);
      setError("Произошла непредвиденная ошибка. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }, [input]);

  const parsed = useMemo(() => {
    if (!result.trim()) return null;
    const { intro, segments } = parseSegmentsFromMarkdown(result);
    if (segments.length === 0) return null;
    return { intro, segments };
  }, [result]);

  return (
    <div
      className={`flex min-h-screen px-4 py-4 font-sans text-sm transition-colors ${
        theme === "dark" ? "bg-zinc-950 text-zinc-50" : "bg-white text-zinc-900"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl gap-3">
        <aside
          className={`hidden w-64 flex-shrink-0 flex-col rounded-lg px-2 py-3 sm:flex ${
            theme === "dark" ? "bg-zinc-900/60" : "bg-zinc-100/80"
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-2 px-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Segments
            </span>
            <button
              type="button"
              onClick={handleNewChat}
              className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm ${
                theme === "dark"
                  ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              + New chat
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => handleSelectChat(chat.id)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-[13px] transition ${
                  chat.id === activeChatId
                    ? theme === "dark"
                      ? "bg-zinc-800 text-zinc-50 shadow-sm"
                      : "bg-white text-zinc-900 shadow-sm"
                    : theme === "dark"
                      ? "text-zinc-300 hover:bg-zinc-800/70"
                      : "text-zinc-700 hover:bg-zinc-200/80"
                }`}
              >
                <span className="truncate">{chat.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main
          className={`flex-1 rounded-xl border p-5 shadow-sm backdrop-blur ${
            theme === "dark"
              ? "border-zinc-800 bg-zinc-900/60"
              : "border-zinc-200 bg-white/70"
          }`}
        >
          <header
            className={`mb-6 flex items-center justify-between gap-3 border-b pb-3 ${
              theme === "dark" ? "border-zinc-800" : "border-zinc-200"
            }`}
          >
            <div>
              <h1 className="text-[26px] font-semibold tracking-tight">
                User Segments
              </h1>
              <p
                className={`mt-1 text-xs ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                Опишите продукт или фичу — мы разложим пользователей на 4–5
                сегментов в формате JTBD.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <nav className="flex items-center gap-1 text-[11px] font-medium">
                <Link
                  href="/"
                  className={`rounded-md px-2 py-1 transition ${
                    pathname === "/"
                      ? theme === "dark"
                        ? "bg-zinc-800 text-zinc-50"
                        : "bg-zinc-900 text-zinc-50"
                      : theme === "dark"
                        ? "text-zinc-300 hover:bg-zinc-800/80"
                        : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Design Brief
                </Link>
                <Link
                  href="/user-segments"
                  className={`rounded-md px-2 py-1 transition ${
                    pathname?.startsWith("/user-segments")
                      ? theme === "dark"
                        ? "bg-zinc-800 text-zinc-50"
                        : "bg-zinc-900 text-zinc-50"
                      : theme === "dark"
                        ? "text-zinc-300 hover:bg-zinc-800/80"
                        : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  User Segments
                </Link>
                <Link
                  href="/kb"
                  className={`rounded-md px-2 py-1 transition ${
                    pathname?.startsWith("/kb")
                      ? theme === "dark"
                        ? "bg-zinc-800 text-zinc-50"
                        : "bg-zinc-900 text-zinc-50"
                      : theme === "dark"
                        ? "text-zinc-300 hover:bg-zinc-800/80"
                        : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  База знаний
                </Link>
                <Link
                  href="/ask"
                  className={`rounded-md px-2 py-1 transition ${
                    pathname?.startsWith("/ask")
                      ? theme === "dark"
                        ? "bg-zinc-800 text-zinc-50"
                        : "bg-zinc-900 text-zinc-50"
                      : theme === "dark"
                        ? "text-zinc-300 hover:bg-zinc-800/80"
                        : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Спросить
                </Link>
              </nav>
              <button
                type="button"
                onClick={() =>
                  setTheme((prev) => (prev === "light" ? "dark" : "light"))
                }
                className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-[11px] font-medium transition ${
                  theme === "dark"
                    ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {theme === "dark" ? "Dark theme" : "Light theme"}
              </button>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="segments-input"
                  className="block text-xs font-medium text-zinc-600"
                >
                  Описание продукта / фичи
                </label>
                <textarea
                  id="segments-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={8}
                  className={`w-full resize-none rounded-md border bg-zinc-50/60 px-3 py-2 text-xs outline-none transition focus:ring-0 ${
                    theme === "dark"
                      ? "border-zinc-700 bg-zinc-900/60 text-zinc-50 focus:border-zinc-300"
                      : "border-zinc-200 text-zinc-900 focus:border-zinc-900 focus:bg-white"
                  }`}
                  placeholder="Кратко опишите продукт, основные сценарии и метрики успеха. Например: SaaS‑продукт для командной работы над проектами, основная метрика — активные команды и retention."
                />
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-3">
                <span className="text-[11px] text-zinc-500">
                  Чат: {chats.find((c) => c.id === activeChatId)?.title}
                </span>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-1.5 text-[13px] font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
                >
                  {isLoading ? "Генерируем..." : "Сгенерировать сегменты"}
                </button>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="segments-chat-input"
                  className="block text-xs font-medium text-zinc-600"
                >
                  Поле ввода в чате
                </label>
                <input
                  id="segments-chat-input"
                  type="text"
                  placeholder="Задайте уточняющий вопрос по сегментам (пока без отправки)…"
                  className={`w-full rounded-md border px-3 py-2 text-xs outline-none transition ${
                    theme === "dark"
                      ? "border-zinc-700 bg-zinc-900/60 text-zinc-50 focus:border-zinc-300"
                      : "border-zinc-200 bg-white text-zinc-900 focus:border-zinc-900"
                  }`}
                />
                <p className="text-[11px] text-zinc-500">
                  Сейчас это просто поле для ввода текста в стиле чата. Позже его
                  можно связать с отдельным эндпоинтом для уточняющих вопросов.
                </p>
              </div>
            </div>

            <div
              className={`rounded-md border p-3 ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-900/60"
                  : "border-zinc-200 bg-zinc-50/80"
              }`}
            >
              <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                Ошибки
              </h2>
              <div className="min-h-[40px] rounded-md border border-red-200 bg-red-50/80 px-3 py-2 text-[11px] text-red-700">
                {error || "Ошибок нет."}
              </div>
            </div>
          </section>

          <section
            className={`mt-8 rounded-xl border p-5 ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900/40"
                : "border-zinc-200 bg-zinc-50/60"
            }`}
          >
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Сегменты пользователей
            </h2>

            {parsed ? (
              <div className="space-y-4">
                {parsed.intro && (
                  <p
                    className={`rounded-lg border-l-4 pl-3 text-[13px] leading-relaxed ${
                      theme === "dark"
                        ? "border-zinc-600 text-zinc-300"
                        : "border-zinc-300 text-zinc-700"
                    }`}
                  >
                    {parsed.intro}
                  </p>
                )}

                <div
                  className={`overflow-hidden rounded-lg border ${
                    theme === "dark"
                      ? "border-zinc-700 bg-zinc-900/80"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                      <thead>
                        <tr
                          className={
                            theme === "dark"
                              ? "border-b border-zinc-700 bg-zinc-800/80"
                              : "border-b border-zinc-200 bg-zinc-100/80"
                          }
                        >
                          <th
                            className={`px-4 py-3 font-semibold ${
                              theme === "dark"
                                ? "text-zinc-200"
                                : "text-zinc-800"
                            }`}
                          >
                            Сегмент
                          </th>
                          <th
                            className={`px-4 py-3 font-semibold ${
                              theme === "dark"
                                ? "text-zinc-200"
                                : "text-zinc-800"
                            }`}
                          >
                            Описание
                          </th>
                          <th
                            className={`px-4 py-3 font-semibold ${
                              theme === "dark"
                                ? "text-zinc-200"
                                : "text-zinc-800"
                            }`}
                          >
                            Работы (JTBD)
                          </th>
                          <th
                            className={`w-24 px-4 py-3 text-right font-semibold ${
                              theme === "dark"
                                ? "text-zinc-200"
                                : "text-zinc-800"
                            }`}
                          >
                            % пользователей
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.segments.map((seg, idx) => (
                          <tr
                            key={idx}
                            className={
                              theme === "dark"
                                ? "border-b border-zinc-800 hover:bg-zinc-800/50"
                                : "border-b border-zinc-100 hover:bg-zinc-50/80"
                            }
                          >
                            <td
                              className={`px-4 py-3 font-medium ${
                                theme === "dark"
                                  ? "text-zinc-100"
                                  : "text-zinc-900"
                              }`}
                            >
                              {seg.name}
                            </td>
                            <td
                              className={`max-w-[280px] px-4 py-3 leading-relaxed ${
                                theme === "dark"
                                  ? "text-zinc-300"
                                  : "text-zinc-600"
                              }`}
                            >
                              {seg.description}
                            </td>
                            <td
                              className={`px-4 py-3 ${
                                theme === "dark"
                                  ? "text-zinc-300"
                                  : "text-zinc-600"
                              }`}
                            >
                              <ul className="list-inside list-disc space-y-0.5 text-[12px]">
                                {seg.jtbd.length > 0
                                  ? seg.jtbd.map((j, i) => (
                                      <li key={i}>{j}</li>
                                    ))
                                  : "—"}
                              </ul>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium ${
                                  theme === "dark"
                                    ? "bg-zinc-700 text-zinc-100"
                                    : "bg-zinc-200 text-zinc-800"
                                }`}
                              >
                                {seg.percent}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : result ? (
              <div
                className={`min-h-[120px] rounded-lg border border-dashed p-4 ${
                  theme === "dark"
                    ? "border-zinc-700 bg-zinc-900/70"
                    : "border-zinc-200 bg-white/70"
                }`}
              >
                <pre
                  className={`whitespace-pre-wrap break-words text-[12px] leading-relaxed ${
                    theme === "dark" ? "text-zinc-100" : "text-zinc-800"
                  }`}
                >
                  {result}
                </pre>
              </div>
            ) : (
              <p
                className={`rounded-lg border border-dashed py-8 text-center text-[13px] ${
                  theme === "dark"
                    ? "border-zinc-700 text-zinc-500"
                    : "border-zinc-200 text-zinc-500"
                }`}
              >
                Нажмите «Сгенерировать сегменты» — здесь появится таблица с
                сегментами в формате Notion.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}


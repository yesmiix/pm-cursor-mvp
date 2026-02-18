"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { AppHeader } from "../components/AppHeader";

type AskResponse = {
  ok: boolean;
  answer?: string;
  chunks?: { content: string; score: number }[];
  error?: string;
};

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState<{ content: string; score: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pathname = usePathname();

  const handleAsk = useCallback(async () => {
    setError("");
    setAnswer("");
    setChunks([]);
    const q = question.trim();
    if (!q) {
      setError("Введите вопрос.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data: AskResponse = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Ошибка при запросе.");
        return;
      }
      setAnswer(data.answer ?? "");
      setChunks(data.chunks ?? []);
    } catch {
      setError("Произошла ошибка. Проверьте, что документ загружен на /kb.");
    } finally {
      setLoading(false);
    }
  }, [question]);

  return (
    <div
      className={`flex min-h-screen flex-col font-sans text-sm transition-colors ${
        theme === "dark" ? "bg-zinc-950 text-zinc-50" : "bg-white text-zinc-900"
      }`}
    >
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-5">
        <AppHeader
          pathname={pathname ?? ""}
          theme={theme}
          setTheme={setTheme}
          title="Спросить по документу"
          description="Ответы только по загруженному документу. Сначала сохраните документ на странице «База знаний»."
        />
        <main
          className={`card mt-6 rounded-xl border p-6 ${
            theme === "dark"
              ? "border-zinc-800 bg-zinc-900/60"
              : "border-zinc-200 bg-white"
          }`}
        >
          <section className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-600">
                Вопрос
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                placeholder="Задайте вопрос по содержимому документа..."
                className={`input-smooth w-full resize-none rounded-lg border px-3 py-2 text-xs ${
                  theme === "dark"
                    ? "border-zinc-700 bg-zinc-900/60 text-zinc-50 placeholder:text-zinc-500"
                    : "border-zinc-200 text-zinc-900 placeholder:text-zinc-400 bg-white"
                }`}
              />
              <button
                type="button"
                onClick={handleAsk}
                disabled={loading}
                className="btn-primary rounded-lg bg-zinc-900 px-5 py-2 text-[13px] font-medium text-zinc-50 shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
              >
                {loading ? "Ищем ответ…" : "Спросить"}
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-2.5 text-[11px] text-red-700 shadow-sm">
                {error}
              </div>
            )}

            {answer && (
              <div className="space-y-2" style={{ animation: "fade-in 0.2s ease-out" }}>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Ответ
                </h2>
                <div
                  className={`card min-h-[80px] rounded-lg border p-4 ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-900/70"
                      : "border-zinc-200 bg-zinc-50/80"
                  }`}
                >
                  <p
                    className={`whitespace-pre-wrap break-words text-[12px] leading-relaxed ${
                      theme === "dark" ? "text-zinc-100" : "text-zinc-800"
                    }`}
                  >
                    {answer}
                  </p>
                </div>
              </div>
            )}

            {chunks.length > 0 && (
              <div className="space-y-2" style={{ animation: "fade-in 0.2s ease-out" }}>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Использованный контекст (чанки)
                </h2>
                <div className="space-y-2">
                  {chunks.map((c, i) => (
                    <div
                      key={i}
                      className={`card rounded-lg border p-3 text-[11px] ${
                        theme === "dark"
                          ? "border-zinc-700 bg-zinc-900/50 text-zinc-300"
                          : "border-zinc-200 bg-zinc-50/80 text-zinc-700"
                      }`}
                    >
                      <span className="font-medium text-zinc-500">
                        Чанк {i + 1}, score: {c.score}
                      </span>
                      <p className="mt-1 whitespace-pre-wrap break-words">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

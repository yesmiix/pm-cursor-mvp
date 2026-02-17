"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

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

  const linkClass = (path: string) =>
    pathname === path
      ? theme === "dark"
        ? "bg-zinc-800 text-zinc-50"
        : "bg-zinc-900 text-zinc-50"
      : theme === "dark"
        ? "text-zinc-300 hover:bg-zinc-800/80"
        : "text-zinc-600 hover:bg-zinc-100";

  return (
    <div
      className={`flex min-h-screen px-4 py-4 font-sans text-sm transition-colors ${
        theme === "dark" ? "bg-zinc-950 text-zinc-50" : "bg-white text-zinc-900"
      }`}
    >
      <div className="mx-auto w-full max-w-3xl">
        <main
          className={`rounded-xl border p-5 shadow-sm backdrop-blur ${
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
                Спросить по документу
              </h1>
              <p
                className={`mt-1 text-xs ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                Ответы только по загруженному документу. Сначала сохраните документ на странице «База знаний».
              </p>
            </div>
            <div className="flex items-center gap-3">
              <nav className="flex items-center gap-1 text-[11px] font-medium">
                <Link href="/" className={`rounded-md px-2 py-1 transition ${linkClass("/")}`}>
                  Design Brief
                </Link>
                <Link href="/user-segments" className={`rounded-md px-2 py-1 transition ${linkClass("/user-segments")}`}>
                  User Segments
                </Link>
                <Link href="/kb" className={`rounded-md px-2 py-1 transition ${linkClass("/kb")}`}>
                  База знаний
                </Link>
                <Link href="/ask" className={`rounded-md px-2 py-1 transition ${linkClass("/ask")}`}>
                  Спросить
                </Link>
                <Link href="/backlog" className={`rounded-md px-2 py-1 transition ${linkClass("/backlog")}`}>
                  Backlog
                </Link>
              </nav>
              <button
                type="button"
                onClick={() => setTheme((p) => (p === "light" ? "dark" : "light"))}
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
                className={`w-full resize-none rounded-md border bg-zinc-50/60 px-3 py-2 text-xs outline-none transition focus:ring-0 ${
                  theme === "dark"
                    ? "border-zinc-700 bg-zinc-900/60 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-300"
                    : "border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white"
                }`}
              />
              <button
                type="button"
                onClick={handleAsk}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-1.5 text-[13px] font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
              >
                {loading ? "Ищем ответ…" : "Спросить"}
              </button>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50/80 px-3 py-2 text-[11px] text-red-700">
                {error}
              </div>
            )}

            {answer && (
              <div className="space-y-2">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Ответ
                </h2>
                <div
                  className={`min-h-[80px] rounded-md border p-3 ${
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
              <div className="space-y-2">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Использованный контекст (чанки)
                </h2>
                <div className="space-y-2">
                  {chunks.map((c, i) => (
                    <div
                      key={i}
                      className={`rounded-md border p-2 text-[11px] ${
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

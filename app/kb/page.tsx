"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type KbGetResponse = {
  ok: boolean;
  doc: { title: string; content: string; updatedAt: string } | null;
  meta: { chunksCount: number };
  error?: string;
};

type KbSetResponse = {
  ok: boolean;
  chunksCount?: number;
  warning?: string;
  error?: string;
};

export default function KbPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [savedDoc, setSavedDoc] = useState<{
    title: string;
    content: string;
    chunksCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pathname = usePathname();

  const fetchDoc = useCallback(async () => {
    try {
      const res = await fetch("/api/kb/get");
      const data: KbGetResponse = await res.json();
      if (data.ok && data.doc) {
        setSavedDoc({
          title: data.doc.title,
          content: data.doc.content,
          chunksCount: data.meta?.chunksCount ?? 0,
        });
        setTitle(data.doc.title);
        setContent(data.doc.content);
      } else {
        setSavedDoc(null);
        setTitle("");
        setContent("");
      }
    } catch {
      setError("Не удалось загрузить данные.");
    }
  }, []);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  const handleSave = useCallback(async () => {
    setError("");
    setSuccess("");
    if (!title.trim()) {
      setError("Введите название документа.");
      return;
    }
    if (content.length > 100_000) {
      setError("Документ слишком большой (максимум 100 000 символов).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/kb/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content }),
      });
      const data: KbSetResponse = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Ошибка сохранения.");
        return;
      }
      setSuccess(
        `Документ сохранён. Чанков: ${data.chunksCount ?? 0}. ${data.warning ?? ""}`.trim(),
      );
      await fetchDoc();
    } catch {
      setError("Произошла ошибка при сохранении.");
    } finally {
      setLoading(false);
    }
  }, [title, content, fetchDoc]);

  const handleClear = useCallback(async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/kb/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Ошибка удаления.");
        return;
      }
      setSavedDoc(null);
      setTitle("");
      setContent("");
      setSuccess("Документ удалён.");
    } catch {
      setError("Произошла ошибка при удалении.");
    } finally {
      setLoading(false);
    }
  }, []);

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
                База знаний (One-doc RAG)
              </h1>
              <p
                className={`mt-1 text-xs ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                Загрузите один документ (text/markdown). Он будет разбит на чанки и использован для ответов на вопросы.
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
                <Link href="/feedback" className={`rounded-md px-2 py-1 transition ${linkClass("/feedback")}`}>
                  User Feedback
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

          <section className="space-y-4">
            {savedDoc && (
              <div
                className={`rounded-md border px-3 py-2 text-xs ${
                  theme === "dark" ? "border-emerald-800 bg-emerald-950/40 text-emerald-200" : "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                }`}
              >
                Документ сохранён: «{savedDoc.title}» ({savedDoc.chunksCount} чанков).
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-600">
                Название документа
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Описание продукта"
                className={`w-full rounded-md border bg-zinc-50/60 px-3 py-2 text-xs outline-none transition focus:ring-0 ${
                  theme === "dark"
                    ? "border-zinc-700 bg-zinc-900/60 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-300"
                    : "border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-600">
                Текст документа (text/markdown, до 100k символов)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                placeholder="Вставьте или введите текст документа..."
                className={`w-full resize-none rounded-md border bg-zinc-50/60 px-3 py-2 text-xs outline-none transition focus:ring-0 ${
                  theme === "dark"
                    ? "border-zinc-700 bg-zinc-900/60 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-300"
                    : "border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white"
                }`}
              />
              {content.length > 50_000 && (
                <p className="text-[11px] text-amber-600">
                  Документ больше 50k символов — возможны ограничения по лимитам.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-1.5 text-[13px] font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
              >
                {loading ? "Сохранение…" : "Сохранить документ"}
              </button>
              {savedDoc && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 px-4 py-1.5 text-[13px] font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Удалить документ
                </button>
              )}
            </div>

            {success && (
              <p className="text-[11px] text-emerald-600">{success}</p>
            )}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50/80 px-3 py-2 text-[11px] text-red-700">
                {error}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
